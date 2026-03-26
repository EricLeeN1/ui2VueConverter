import { Scanner } from '../src/core/scanner.js';
import { UiLibraryAdapter } from '../src/core/ui-library-adapter.js';

// 测试目录扫描功能
async function testScanner() {
  console.log('=== 测试目录扫描功能 ===');
  // 替换为你的测试截图目录
  const testDir = '/Users/your-username/your-screenshots-directory';
  const scanner = new Scanner(testDir);
  const groups = await scanner.scan();

  console.log(`识别到 ${groups.length} 个页面组:`);
  groups.forEach(group => {
    console.log(`- ${group.name}: ${group.states.length} 个状态`);
    group.states.forEach(state => {
      console.log(`  * ${state.state}: ${state.description}`);
    });
  });
}

// 测试UI库适配
function testUiAdapter() {
  console.log('\n=== 测试UI库适配 ===');

  const vantAdapter = new UiLibraryAdapter('vant');
  const vantConfig = vantAdapter.getConfig();
  console.log(`Vant UI 组件数: ${Object.keys(vantConfig.componentMap).length}`);

  const elementAdapter = new UiLibraryAdapter('element-plus');
  const elementConfig = elementAdapter.getConfig();
  console.log(`Element Plus 组件数: ${Object.keys(elementConfig.componentMap).length}`);
}

// 运行测试
async function runTests() {
  await testScanner();
  testUiAdapter();
  console.log('\n✅ 测试完成');
}

runTests().catch(console.error);
