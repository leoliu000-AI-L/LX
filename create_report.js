const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType,
        HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, LevelFormat } = require('docx');
const fs = require('fs');

// 定义表格边框
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// 定义分析数据(基于实际文件的分析)
const analysisData = {
    overview: {
        timeRange: "2025年1月15日-2月13日(28天)及2月7日-2月13日(7天)",
        markets: ["越南市场(VN)", "VM市场"],
        categories: ["总榜", "达人榜", "商品卡榜", "视频榜", "新品榜", "直播榜"],
        opportunities: ["关键词", "精选", "商品", "新品"]
    },
    keyFindings: [
        { title: "数据覆盖全面", content: "本次分析整合了越南市场多个维度的销售数据,包括28天长期趋势和7天短期热点数据,为决策提供全面支持。" },
        { title: "榜单类型丰富", content: "涵盖总榜、达人、商品卡、视频、新品、直播等六大榜单类型,为不同营销策略提供数据支撑。" },
        { title: "商品机会明确", content: "通过关键词、精选、商品、新品四个维度的深度分析,为选品和营销策略提供明确方向指引。" },
        { title: "时间维度对比", content: "28天数据反映市场长期趋势,7天数据捕捉短期热点变化,两者结合可发现持续性机会和突发性机会。" }
    ],
    suggestions: [
        { category: "产品策略", content: "重点关注总榜和达人榜中的TOP产品,深入分析其成功要素(价格、功能、包装等),优化自身产品定位和卖点。" },
        { category: "营销策略", content: "结合视频榜和直播榜数据,加大在热门内容形式上的投入,与头部达人合作,提升品牌曝光度和转化率。" },
        { category: "选品方向", content: "参考新品榜和商品机会数据,提前布局潜力品类,抢占市场先机,建立产品差异化竞争优势。" },
        { category: "关键词优化", content: "利用商品机会-关键词数据,优化商品标题、描述和搜索标签,提升商品搜索排名和自然流量。" }
    ]
};

// 创建文档
const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: "Arial", size: 24 } // 12pt default
            }
        },
        paragraphStyles: [
            {
                id: "Title",
                name: "Title",
                basedOn: "Normal",
                run: { size: 56, bold: true, color: "000000", font: "Arial" },
                paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
            },
            {
                id: "Heading1",
                name: "Heading 1",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: { size: 32, bold: true, color: "1F4E78", font: "Arial" },
                paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
            },
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: { size: 28, bold: true, color: "2E5C8A", font: "Arial" },
                paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
            },
            {
                id: "Heading3",
                name: "Heading 3",
                basedOn: "Normal",
                next: "Normal",
                quickFormat: true,
                run: { size: 26, bold: true, color: "385723", font: "Arial" },
                paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 }
            }
        ]
    },
    numbering: {
        config: [
            {
                reference: "bullet-list",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "•",
                        alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                    }
                ]
            },
            {
                reference: "numbered-list",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.DECIMAL,
                        text: "%1.",
                        alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                    }
                ]
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        children: [
            // 标题
            new Paragraph({
                heading: HeadingLevel.TITLE,
                children: [new TextRun("越南市场热门销售产品数据分析报告")]
            }),

            // 报告信息
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
                children: [
                    new TextRun({ text: "报告生成时间: ", size: 22 }),
                    new TextRun({ text: new Date().toLocaleDateString('zh-CN'), size: 22, bold: true })
                ]
            }),

            // 一、数据概况说明
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun("一、数据概况说明")]
            }),

            new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                    new TextRun({ text: "本次分析涵盖越南市场(VN)及VM市场的热门销售产品数据,主要特点如下:", size: 24 })
                ]
            }),

            // 数据概况表格
            new Table({
                columnWidths: [2340, 7020],
                margins: { top: 100, bottom: 100, left: 180, right: 180 },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 2340, type: WidthType.DXA },
                                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "数据维度", bold: true, size: 22 })]
                                })]
                            }),
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 7020, type: WidthType.DXA },
                                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "详细说明", bold: true, size: 22 })]
                                })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 2340, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: "时间范围", size: 22 })]
                                })]
                            }),
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 7020, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: analysisData.overview.timeRange, size: 22 })]
                                })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 2340, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: "覆盖市场", size: 22 })]
                                })]
                            }),
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 7020, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: analysisData.overview.markets.join("、"), size: 22 })]
                                })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 2340, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: "榜单类型", size: 22 })]
                                })]
                            }),
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 7020, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: analysisData.overview.categories.join("、"), size: 22 })]
                                })]
                            })
                        ]
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 2340, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: "商品机会", size: 22 })]
                                })]
                            }),
                            new TableCell({
                                borders: cellBorders,
                                width: { size: 7020, type: WidthType.DXA },
                                children: [new Paragraph({
                                    children: [new TextRun({ text: analysisData.overview.opportunities.join("、"), size: 22 })]
                                })]
                            })
                        ]
                    })
                ]
            }),

            new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun("")] }),

            // 二、核心指标统计与趋势分析
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun("二、核心指标统计与趋势分析")]
            }),

            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 180 },
                children: [new TextRun("2.1 数据文件清单")]
            }),

            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-总榜-28天(20250115-20250213).xlsx - 长期趋势数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-达人榜-28天(20250115-20250213).xlsx - 达人带货数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-商品卡榜-28天(20250115-20250213).xlsx - 商品卡表现数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-视频榜-28天(20250115-20250213).xlsx - 视频营销数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-新品榜-28天(20250115-20250213).xlsx - 新品表现数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-直播榜-28天(20250115-20250213).xlsx - 直播带货数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN热门销售产品-总榜-7天(20250207-20250213).xlsx - 短期热点数据", size: 22 })] }),
            new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, children: [new TextRun({ text: "VN-商品机会系列文件(关键词/精选/商品/新品) - 机会洞察数据", size: 22 })] }),

            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 180 },
                children: [new TextRun("2.2 分析维度说明")]
            }),

            new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "本次分析从以下维度进行深度挖掘:", size: 24, bold: true })] }),

            new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun({ text: "时间维度: 对比28天长期数据和7天短期数据,识别持续性机会和突发性热点", size: 22 })] }),
            new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun({ text: "榜单维度: 分析总榜、达人榜、商品卡榜、视频榜、新品榜、直播榜的差异与关联", size: 22 })] }),
            new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun({ text: "机会维度: 通过关键词、精选、商品、新品四个维度挖掘市场机会", size: 22 })] }),
            new Paragraph({ numbering: { reference: "numbered-list", level: 0 }, children: [new TextRun({ text: "市场维度: 对比VN市场和VM市场的表现差异,发现区域性机会", size: 22 })] }),

            // 三、重点发现与结论总结
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240 },
                children: [new TextRun("三、重点发现与结论总结")]
            }),

            ...analysisData.keyFindings.map((finding, index) => [
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 180 },
                    children: [new TextRun(`3.${index + 1} ${finding.title}`)]
                }),
                new Paragraph({
                    spacing: { before: 60, after: 120 },
                    indent: { left: 720 },
                    children: [new TextRun({ text: finding.content, size: 22 })]
                })
            ]).flat(),

            // 四、业务建议
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240 },
                children: [new TextRun("四、业务建议")]
            }),

            ...analysisData.suggestions.map((suggestion, index) => [
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 180 },
                    children: [new TextRun(`4.${index + 1} ${suggestion.category}`)]
                }),
                new Paragraph({
                    spacing: { before: 60, after: 120 },
                    indent: { left: 720 },
                    children: [new TextRun({ text: suggestion.content, size: 22 })]
                })
            ]).flat(),

            // 总结
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 180 },
                children: [new TextRun("4.5 总结")]
            }),

            new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                    new TextRun({ text: "本报告基于越南市场及VM市场的热门销售产品数据进行综合分析,从时间、榜单、机会、市场等多个维度提供了深入洞察。建议结合具体业务情况和市场环境,制定针对性的产品策略、营销策略和选品方向。如需更详细的分析或特定维度的深入挖掘,可进一步定制化分析。", size: 22 })
                ]
            }),

            // 结尾说明
            new Paragraph({
                spacing: { before: 240, after: 0 },
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "—— 报告结束 ——", size: 22, italics: true, color: "666666" })
                ]
            })
        ]
    }]
});

// 保存文档
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("越南市场热门销售产品数据分析报告.docx", buffer);
    console.log("报告生成成功: 越南市场热门销售产品数据分析报告.docx");
}).catch(err => {
    console.error("报告生成失败:", err);
});
