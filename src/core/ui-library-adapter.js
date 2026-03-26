export class UiLibraryAdapter {
  constructor(libraryName) {
    this.libraryName = libraryName;
    this.configs = {
      vant: {
        name: 'Vant',
        import: "import { Button, Cell, CellGroup, Dialog, Popup, Toast, Form, Field, List, Tabs, Tab, Empty } from 'vant';",
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
          'empty': 'van-empty'
        },
        template: 'mobile'
      },
      'element-plus': {
        name: 'Element Plus',
        import: "import { ElButton, ElCard, ElDialog, ElForm, ElFormItem, ElInput, ElTable, ElTableColumn, ElMessage, ElMessageBox, ElEmpty } from 'element-plus';",
        componentMap: {
          'button': 'el-button',
          'card': 'el-card',
          'dialog': 'el-dialog',
          'form': 'el-form',
          'form-item': 'el-form-item',
          'input': 'el-input',
          'table': 'el-table',
          'table-column': 'el-table-column',
          'empty': 'el-empty'
        },
        template: 'pc'
      },
      'antd-vue': {
        name: 'Ant Design Vue',
        import: "import { AButton, ACard, AModal, AForm, AFormItem, AInput, ATable, AMessage, AEmpty } from 'ant-design-vue';",
        componentMap: {
          'button': 'a-button',
          'card': 'a-card',
          'dialog': 'a-modal',
          'form': 'a-form',
          'form-item': 'a-form-item',
          'input': 'a-input',
          'table': 'a-table',
          'table-column': 'a-table-column',
          'empty': 'a-empty'
        },
        template: 'pc'
      }
    };
  }

  getConfig() {
    return this.configs[this.libraryName] || this.configs.vant;
  }
}
