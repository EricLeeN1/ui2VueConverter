import { glob } from 'glob';
import path from 'path';
import fs from 'fs-extra';

export class Scanner {
  constructor(inputDir) {
    this.inputDir = inputDir;
  }

  async scan() {
    // 查找所有图片文件
    const imageFiles = await glob('**/*.{png,jpg,jpeg}', {
      cwd: this.inputDir,
      absolute: true,
      ignore: ['**/.DS_Store']
    });

    // 按目录分组
    const groups = {};

    for (const file of imageFiles) {
      const relativePath = path.relative(this.inputDir, file);
      const parts = relativePath.split(path.sep);

      // 页面名称取目录名 + 文件名前缀（去掉状态后缀）
      let pageName;
      if (parts.length > 1) {
        // 有子目录，以子目录名为页面组
        pageName = parts[0];
      } else {
        // 根目录下的文件，取文件名前缀
        pageName = path.basename(file, path.extname(file)).split(/[-_]/)[0];
      }

      // 识别状态
      const fileName = path.basename(file, path.extname(file));
      const state = this.detectState(fileName);

      if (!groups[pageName]) {
        groups[pageName] = {
          name: pageName,
          componentName: this.toPascalCase(pageName) + '.vue',
          states: []
        };
      }

      groups[pageName].states.push({
        file,
        state,
        description: fileName
      });
    }

    return Object.values(groups);
  }

  detectState(fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('list') || lowerName.includes('首页')) return 'list';
    if (lowerName.includes('detail') || lowerName.includes('详情')) return 'detail';
    if (lowerName.includes('form') || lowerName.includes('编辑') || lowerName.includes('新建')) return 'form';
    if (lowerName.includes('modal') || lowerName.includes('弹窗') || lowerName.includes('确认')) return 'modal';
    if (lowerName.includes('success') || lowerName.includes('成功')) return 'success';
    if (lowerName.includes('error') || lowerName.includes('失败')) return 'error';
    return 'default';
  }

  toPascalCase(str) {
    return str.replace(/(^|[-_/\. ])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[-_/\. ]/g, '');
  }
}
