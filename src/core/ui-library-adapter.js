export class UiLibraryAdapter {
  constructor(libraryName) {
    this.libraryName = libraryName;
    this.configs = {
      vant: {
        name: 'Vant',
        import: "import { Button, Cell, CellGroup, Dialog, Popup, Toast, Form, Field, List, Tabs, Tab, Empty, Loading, Skeleton } from 'vant';",
        componentMap: {
          'button': 'van-button',
          'cell': 'van-cell',
          'cell-group': 'van-cell-group',
          'dialog': 'van-dialog',
          'popup': 'van-popup',
          'toast': 'van-toast',
          'form': 'van-form',
          'input': 'van-field',
          'list': 'van-list',
          'tabs': 'van-tabs',
          'tab': 'van-tab',
          'empty': 'van-empty',
          'loading': 'van-loading',
          'skeleton': 'van-skeleton'
        },
        template: 'mobile',
        designWidth: 375,  // 移动端设计稿宽度
        rootValue: 37.5    // postcss-pxtorem rootValue
      },
      'element-plus': {
        name: 'Element Plus',
        import: "import { ElButton, ElCard, ElDialog, ElForm, ElFormItem, ElInput, ElTable, ElTableColumn, ElMessage, ElMessageBox, ElEmpty, ElSkeleton, ElLoading } from 'element-plus';",
        componentMap: {
          'button': 'el-button',
          'card': 'el-card',
          'dialog': 'el-dialog',
          'form': 'el-form',
          'form-item': 'el-form-item',
          'input': 'el-input',
          'table': 'el-table',
          'table-column': 'el-table-column',
          'empty': 'el-empty',
          'skeleton': 'el-skeleton',
          'loading': 'el-loading'
        },
        template: 'pc',
        designWidth: 1920  // PC端设计稿宽度，直接用px，无需rem
      },
      'antd-vue': {
        name: 'Ant Design Vue',
        import: "import { AButton, ACard, AModal, AForm, AFormItem, AInput, ATable, AMessage, AEmpty, ASkeleton, ASpin } from 'ant-design-vue';",
        componentMap: {
          'button': 'a-button',
          'card': 'a-card',
          'dialog': 'a-modal',
          'form': 'a-form',
          'form-item': 'a-form-item',
          'input': 'a-input',
          'table': 'a-table',
          'table-column': 'a-table-column',
          'empty': 'a-empty',
          'skeleton': 'a-skeleton',
          'loading': 'a-spin'
        },
        template: 'pc',
        designWidth: 1920
      }
    };
  }

  getConfig() {
    return this.configs[this.libraryName] || this.configs.vant;
  }
}
