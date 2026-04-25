/**
 * CSS/Vue 语法自动修复器
 * 处理 AI 生成代码中常见的未闭合问题
 */

export class SyntaxFixer {
  /**
   * 修复 Vue 文件中的 CSS 语法错误
   * @param {string} code - 原始 Vue 代码
   * @returns {object} { code: string, fixed: boolean, report: string[] }
   */
  static fixVueCode(code) {
    const report = []
    let fixed = false

    // 1. 先处理文件末尾残留的 CSS（在 </style> 之后还有 CSS 代码）
    // 这种情况要优先处理，否则残留 CSS 会被忽略，且移入后还需做花括号匹配
    const lastStyleClose = code.lastIndexOf('</style>')
    if (lastStyleClose > 0) {
      const afterLastStyle = code.slice(lastStyleClose + 8)
      const trailingCss = afterLastStyle.trim()
      if (trailingCss && /[.{]/.test(trailingCss)) {
        // 把末尾残留 CSS 移到最后一个 style 块内
        const beforeStyleEnd = code.slice(0, lastStyleClose)
        code = beforeStyleEnd + '\n' + trailingCss + '\n</style>'
        report.push('将 </style> 之后的残留 CSS 移入 style 块内')
        fixed = true
      }
    }

    // 2. 检测并修复缺失的 </style> 标签
    const styleOpenCount = (code.match(/<style/g) || []).length
    const styleCloseCount = (code.match(/<\/style>/g) || []).length

    if (styleOpenCount > styleCloseCount) {
      const missing = styleOpenCount - styleCloseCount
      code += '\n' + '</style>\n'.repeat(missing)
      report.push(`自动补全 ${missing} 个缺失的 </style> 标签`)
      fixed = true
    }

    // 3. 提取每个 style 块，检查 { } 匹配
    const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/g
    let match
    let blockIndex = 0

    while ((match = styleBlockRegex.exec(code)) !== null) {
      blockIndex++
      const blockStart = match.index + match[0].indexOf('>') + 1
      const blockEnd = match.index + match[0].lastIndexOf('<')
      const cssContent = code.slice(blockStart, blockEnd)
      const linesBeforeBlock = code.slice(0, blockStart).split('\n').length

      const braceResult = this.fixBraces(cssContent, linesBeforeBlock)
      if (braceResult.fixed) {
        const beforeBlock = code.slice(0, blockStart)
        const afterBlock = code.slice(blockEnd)
        code = beforeBlock + braceResult.code + afterBlock
        report.push(...braceResult.report.map(r => `Style块 #${blockIndex}: ${r}`))
        fixed = true
      }
    }

    return { code, fixed, report }
  }

  /**
   * 修复 CSS 块中的花括号匹配问题
   * @param {string} css - CSS 内容
   * @param {number} startLine - CSS 块起始行号（用于报告）
   * @returns {object} { code: string, fixed: boolean, report: string[] }
   */
  static fixBraces(css, startLine = 1) {
    const report = []
    const stack = []
    const lines = css.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = startLine + i

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '{') {
          // 记录 { 的位置信息
          // 尝试提取上下文（前面最近的选择器或规则名）
          const context = this.extractContext(line, j)
          stack.push({
            line: lineNum,
            col: j + 1,
            context,
            depth: stack.length + 1
          })
        } else if (char === '}') {
          if (stack.length === 0) {
            report.push(`第 ${lineNum} 行出现多余的 }`)
          } else {
            stack.pop()
          }
        }
      }
    }

    if (stack.length === 0) {
      return { code: css, fixed: false, report: [] }
    }

    // 有未闭合的 {，在末尾补全 }
    const missingCount = stack.length
    let fixedCss = css

    // 确保末尾有换行
    if (!fixedCss.endsWith('\n')) {
      fixedCss += '\n'
    }

    // 按嵌套深度倒序补全（先补最内层）
    for (let i = stack.length - 1; i >= 0; i--) {
      const item = stack[i]
      const indent = '  '.repeat(item.depth - 1)
      fixedCss += `${indent}}\n`
      report.push(`.${item.context} { (第${item.line}行, 深度${item.depth}) 未闭合，已自动补全 }`)
    }

    return { code: fixedCss, fixed: true, report }
  }

  /**
   * 提取 { 前面的上下文（选择器名或规则名）
   */
  static extractContext(line, braceIndex) {
    const beforeBrace = line.slice(0, braceIndex).trim()
    if (!beforeBrace) return 'unknown'

    // 取最后一个有意义的词
    const parts = beforeBrace.split(/\s+/)
    return parts[parts.length - 1].replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'unknown'
  }

  /**
   * 打印修复报告
   */
  static printReport(report) {
    if (report.length === 0) return

    console.log('\n🔧 CSS 语法自动修复报告：')
    for (const msg of report) {
      console.log(`  ✓ ${msg}`)
    }
  }
}
