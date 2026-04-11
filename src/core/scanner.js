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

      // 检查是否是切图目录（切图、assets、icons、sprites 等）
      const cutDirs = ['切图', 'assets', 'icons', 'sprites', 'cut', 'images'];
      const isCutImage = parts.some(part => cutDirs.includes(part.toLowerCase()) || cutDirs.includes(part));

      if (isCutImage) {
        // 切图不作为页面处理，跳过
        continue;
      }

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
          states: [],
          cutImages: [] // 新增：存储切图
        };
      }

      groups[pageName].states.push({
        file,
        state,
        description: fileName
      });
    }

    // 为每个页面组查找对应的切图
    for (const pageName of Object.keys(groups)) {
      groups[pageName].cutImages = await this.findCutImages(pageName);
    }

    return Object.values(groups);
  }

  // 查找页面组对应的切图
  async findCutImages(pageName) {
    const cutDirs = ['切图', 'assets', 'icons', 'sprites', 'cut', 'images'];
    const cutImages = [];

    for (const cutDir of cutDirs) {
      // 检查页面目录下的切图子目录
      const cutPath = path.join(this.inputDir, pageName, cutDir);
      if (fs.existsSync(cutPath)) {
        const files = await glob('*.{png,jpg,jpeg,svg}', {
          cwd: cutPath,
          absolute: true
        });
        for (const file of files) {
          cutImages.push({
            file,
            name: path.basename(file, path.extname(file)),
            type: this.detectCutType(path.basename(file))
          });
        }
      }

      // 检查根目录下的切图目录（全局切图）
      const globalCutPath = path.join(this.inputDir, cutDir);
      if (fs.existsSync(globalCutPath)) {
        const files = await glob('*.{png,jpg,jpeg,svg}', {
          cwd: globalCutPath,
          absolute: true
        });
        for (const file of files) {
          cutImages.push({
            file,
            name: path.basename(file, path.extname(file)),
            type: this.detectCutType(path.basename(file)),
            global: true // 标记为全局切图
          });
        }
      }
    }

    return cutImages;
  }

  // 识别切图类型
  detectCutType(fileName) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('icon') || lowerName.includes('图标')) return 'icon';
    if (lowerName.includes('btn') || lowerName.includes('button') || lowerName.includes('按钮')) return 'button';
    if (lowerName.includes('logo')) return 'logo';
    if (lowerName.includes('tab') || lowerName.includes('标签')) return 'tab';
    if (lowerName.includes('badge') || lowerName.includes('徽章')) return 'badge';
    if (lowerName.includes('tag') || lowerName.includes('标记')) return 'tag';
    if (lowerName.includes('arrow') || lowerName.includes('箭头')) return 'arrow';
    if (lowerName.includes('bg') || lowerName.includes('背景')) return 'background';
    return 'other';
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
