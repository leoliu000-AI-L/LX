#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查并加载依赖
let sharp, AdmZip;
try {
    sharp = require('sharp');
    AdmZip = require('adm-zip');
} catch (e) {
    console.error('❌ 依赖未安装，请先运行: npm install');
    process.exit(1);
}

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        width: 150,
        height: 75,
        angle: 90,
        pdf: true,
        output: './output/'
    };
    
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--docx':
                options.docx = args[++i];
                break;
            case '--signature':
                options.signature = args[++i];
                break;
            case '--output':
                options.output = args[++i];
                break;
            case '--width':
                options.width = parseInt(args[++i]);
                break;
            case '--height':
                options.height = parseInt(args[++i]);
                break;
            case '--angle':
                options.angle = parseInt(args[++i]);
                break;
            case '--no-pdf':
                options.pdf = false;
                break;
            case '--help':
            case '-h':
                showHelp();
                process.exit(0);
                break;
        }
    }
    
    if (!options.docx || !options.signature) {
        console.error('❌ 错误: 必须提供 --docx 和 --signature 参数');
        showHelp();
        process.exit(1);
    }
    
    return options;
}

function showHelp() {
    console.log(`
用法: node process.js --docx <docx文件> --signature <签名图片> [选项]

选项:
  --docx <path>       输入的 Word 文档路径 (必填)
  --signature <path>   签名图片路径 (必填)
  --output <dir>       输出目录 (默认: ./output/)
  --width <px>        签名显示宽度 (默认: 150)
  --height <px>       签名显示高度 (默认: 75)
  --angle <deg>       旋转角度 (默认: 90)
  --no-pdf            跳过 PDF 导出
  --help, -h          显示帮助

示例:
  node process.js --docx contract.docx --signature sign.png
  node process.js --docx doc.docx --signature sign.png --width 200 --height 100
`);
}

async function processDocument(options) {
    const startTime = Date.now();
    
    try {
        console.log('\n📝 Docx 签名处理工具\n');
        console.log('═══════════════════════════════════════\n');
        
        // 确保输出目录存在
        if (!fs.existsSync(options.output)) {
            fs.mkdirSync(options.output, { recursive: true });
        }

        const tempDir = path.join(options.output, '.temp_docx');
        
        // 清理临时目录
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }

        console.log('📄 输入文件:');
        console.log(`   文档: ${options.docx}`);
        console.log(`   签名: ${options.signature}\n`);

        // 1. 旋转签名图片 (逆时针90度)
        console.log('🔄 步骤 1/5: 旋转签名图片...');
        const rotatedSignaturePath = path.join(options.output, 'signature_rotated.png');
        
        // 逆时针旋转90度
        await sharp(options.signature)
            .rotate(90)  // 逆时针90度 (正值)
            .toFile(rotatedSignaturePath);
        
        // 获取旋转后的尺寸
        const rotatedMeta = await sharp(rotatedSignaturePath).metadata();
        const shiftX = Math.round(rotatedMeta.width / 2); // 向右移动宽度的一半
        
        const signatureBuffer = await sharp(rotatedSignaturePath)
            .resize(options.width, options.height, { fit: 'inside' })
            .toBuffer();
        
        console.log(`   ✓ 签名已逆时针旋转90度，将向右平移 ${shiftX}px\n`);

        // 2. 解压 docx
        console.log('📦 步骤 2/5: 解压文档...');
        fs.mkdirSync(tempDir, { recursive: true });
        
        const zip = new AdmZip(options.docx);
        zip.extractAllTo(tempDir, true);
        console.log('   ✓ 文档已解压\n');

        // 3. 添加签名到媒体库
        console.log('🖼️  步骤 3/5: 添加签名图片...');
        const mediaDir = path.join(tempDir, 'word', 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }
        
        const signatureMediaName = 'image_signature.png';
        const signatureMediaPath = path.join(mediaDir, signatureMediaName);
        fs.writeFileSync(signatureMediaPath, signatureBuffer);
        
        // 更新 [Content_Types].xml
        const contentTypesPath = path.join(tempDir, '[Content_Types].xml');
        let contentTypesXml = fs.readFileSync(contentTypesPath, 'utf8');
        
        if (!contentTypesXml.includes('image/png')) {
            const overrideInsert = `<Override PartName="/word/media/${signatureMediaName}" ContentType="image/png"/>`;
            contentTypesXml = contentTypesXml.replace('</Types>', overrideInsert + '</Types>');
            fs.writeFileSync(contentTypesPath, contentTypesXml);
        }
        
        // 更新关系
        const relsPath = path.join(tempDir, 'word', '_rels', 'document.xml.rels');
        let relsXml = fs.readFileSync(relsPath, 'utf8');
        
        const idMatches = relsXml.match(/Id="rId(\d+)"/g);
        const maxId = idMatches ? Math.max(...idMatches.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
        const newId = maxId + 1;
        const rId = `rId${newId}`;
        
        const newRel = `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${signatureMediaName}"/>`;
        relsXml = relsXml.replace('</Relationships>', newRel + '</Relationships>');
        fs.writeFileSync(relsPath, relsXml);
        console.log('   ✓ 签名已添加到文档\n');

        // 4. 插入签名到文档
        console.log('✍️  步骤 4/5: 插入签名...');
        const documentXmlPath = path.join(tempDir, 'word', 'document.xml');
        let documentXml = fs.readFileSync(documentXmlPath, 'utf8');
        
        // EMU 单位
        const emuWidth = Math.round(options.width * 914400 / 96);
        const emuHeight = Math.round(options.height * 914400 / 96);
        
        // 计算向右偏移 (EMU单位)
        const emuShiftX = Math.round(options.width * 914400 / 96 / 2); // 向右移动宽度的一半
        
        // 创建签名图片的 XML 片段 (使用 anchor 支持水平偏移)
        const imageXml = `
<w:drawing xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
    <wp:simplePos x="0" y="0"/>
    <wp:positionH relativeFrom="column">
      <wp:posOffset>${emuShiftX}</wp:posOffset>
    </wp:positionH>
    <wp:positionV relativeFrom="paragraph">
      <wp:posOffset>0</wp:posOffset>
    </wp:positionV>
    <wp:extent cx="${emuWidth}" cy="${emuHeight}"/>
    <wp:effectExtent l="0" t="0" r="0" b="0"/>
    <wp:wrapNone/>
    <wp:docPr id="${newId + 100}" name="签名" descr="签名图片"/>
    <wp:cNvGraphicFramePr>
      <a:graphicFrameLocks noChangeAspect="1"/>
    </wp:cNvGraphicFramePr>
    <a:graphic>
      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic>
          <pic:nvPicPr>
            <pic:cNvPr id="0" name="signature.png"/>
            <pic:cNvPicPr/>
          </pic:nvPicPr>
          <pic:blipFill>
            <a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
            <a:stretch>
              <a:fillRect/>
            </a:stretch>
          </pic:blipFill>
          <pic:spPr>
            <a:xfrm>
              <a:off x="0" y="0"/>
              <a:ext cx="${emuWidth}" cy="${emuHeight}"/>
            </a:xfrm>
            <a:prstGeom prst="rect">
              <a:avLst/>
            </a:prstGeom>
          </pic:spPr>
        </pic:pic>
      </a:graphicData>
    </a:graphic>
  </wp:anchor>
</w:drawing>`;

        const runXml = `<w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${imageXml}</w:r>`;
        
        // 查找签名位置
        const signaturePatterns = [
            /(法定代表人（签字）：|法定代表人\(签字\)：|签字：|签名：|签章：)/g,
            /(签字|签名|签章)[：:]?[\s\n]*<\/w:t>/g,
        ];
        
        let inserted = false;
        for (const pattern of signaturePatterns) {
            const match = documentXml.match(pattern);
            if (match) {
                const matchText = match[0];
                const insertionPoint = documentXml.indexOf(matchText) + matchText.length;
                
                // 在匹配文本后立即插入签名图片（同一行/段落内，图片下沿对齐）
                const before = documentXml.substring(0, insertionPoint);
                const after = documentXml.substring(insertionPoint);
                
                // 查找最近的 </w:r>（run结束），在同一 run 后插入图片
                const runEndMatch = after.match(/<\/w:r>/);
                if (runEndMatch) {
                    const runEndIndex = after.indexOf(runEndMatch[0]);
                    // 在 </w:r> 前插入签名 run，保持同一段落，图片下沿对齐
                    documentXml = before + after.substring(0, runEndIndex) + runXml + after.substring(runEndIndex);
                    inserted = true;
                    console.log(`   ✓ 在 "${matchText.substring(0, 15)}..." 后插入签名（下沿对齐）\n`);
                    break;
                }
            }
        }
        
        if (!inserted) {
            const newPara = `<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:pPr><w:jc w:val="center"/></w:pPr>${runXml}</w:p>`;
            documentXml = documentXml.replace('</w:body>', newPara + '</w:body>');
            console.log('   ⚠ 未找到签名位置，在文档末尾插入\n');
        }
        
        fs.writeFileSync(documentXmlPath, documentXml);

        // 5. 打包 docx
        const baseName = path.basename(options.docx, '.docx');
        const outputDocxPath = path.join(options.output, `${baseName}_signed.docx`);
        
        const outputZip = new AdmZip();
        
        function addDirToZip(zip, dirPath, zipPath) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const zipFullPath = zipPath ? path.join(zipPath, item) : item;
                
                if (fs.statSync(fullPath).isDirectory()) {
                    addDirToZip(zip, fullPath, zipFullPath);
                } else {
                    zip.addLocalFile(fullPath, zipPath || '');
                }
            }
        }
        
        addDirToZip(outputZip, tempDir, '');
        outputZip.writeZip(outputDocxPath);

        // 6. 导出 PDF
        let pdfPath = null;
        if (options.pdf) {
            console.log('📄 步骤 5/5: 导出 PDF...');
            
            try {
                execSync('which libreoffice soffice', { stdio: 'pipe' });
                
                const cmd = `cd "${options.output}" && libreoffice --headless --convert-to pdf "${outputDocxPath}"`;
                execSync(cmd, { stdio: 'ignore' });
                
                // LibreOffice 会生成同名 pdf
                const possiblePdfPath = path.join(options.output, `${baseName}_signed.pdf`);
                if (fs.existsSync(possiblePdfPath)) {
                    pdfPath = possiblePdfPath;
                    console.log('   ✓ PDF 导出成功\n');
                } else {
                    throw new Error('PDF 文件未生成');
                }
            } catch (e) {
                console.log('   ⚠ PDF 导出失败 (未安装 LibreOffice)\n');
            }
        }

        // 清理
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        // 输出结果
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log('═══════════════════════════════════════');
        console.log('✅ 处理完成!\n');
        console.log('📁 输出文件:');
        console.log(`   📄 ${outputDocxPath}`);
        if (pdfPath) {
            console.log(`   📕 ${pdfPath}`);
        }
        console.log(`\n⏱️  耗时: ${duration}s\n`);
        
        return {
            docx: outputDocxPath,
            pdf: pdfPath
        };
        
    } catch (error) {
        console.error('\n❌ 处理失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 主程序
(async () => {
    const options = parseArgs();
    await processDocument(options);
})();
