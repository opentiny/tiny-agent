import { promises as fs } from 'node:fs'
import path from 'node:path'
import { program } from 'commander'
import { glob } from 'glob'
import chalk from 'chalk'
import ora from 'ora'
import { fileURLToPath } from 'node:url'

// 获取当前文件的目录路径（ES Module 中需要手动获取 __dirname）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置命令行参数
program
  .version('1.0.0')
  .description('批量更新packages目录下所有package.json的版本号')
  .argument('<version>', '新的版本号 (例如: 1.2.3)')
  .option('-p, --packages-dir <dir>', 'packages目录路径', './packages')
  .parse()

const version = program.args[0]

/**
 * 验证版本号格式
 * @param {string} version - 版本号
 * @returns {boolean} 是否为有效的语义化版本号
 */
function validateVersion(version) {
  const semverRegex =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
  return semverRegex.test(version)
}

/**
 * 更新单个package.json文件
 * @param {string} filePath - 文件路径
 * @param {string} newVersion - 新版本号
 * @returns {Promise<object>} 更新结果
 */
async function updatePackageJson(filePath, newVersion) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const packageJson = JSON.parse(content)
    const oldVersion = packageJson.version || 'unknown'

    packageJson.version = newVersion

    const updatedContent = JSON.stringify(packageJson, null, 2) + '\n'
    await fs.writeFile(filePath, updatedContent, 'utf8')

    return {
      filePath,
      oldVersion,
      newVersion,
      success: true
    }
  } catch (error) {
    return {
      filePath,
      error: error.message,
      success: false
    }
  }
}

/**
 * 检查目录是否存在
 * @param {string} dirPath - 目录路径
 * @returns {Promise<boolean>} 目录是否存在
 */
async function checkDirectoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * 显示更新结果
 * @param {Array} results - 更新结果数组
 */
function displayResults(results) {
  let successCount = 0
  let errorCount = 0

  console.log(chalk.blue.bold('📋 更新结果:\n'))

  results.forEach((result) => {
    if (result.success) {
      successCount++
      const relativePath = path.relative(process.cwd(), result.filePath)
      console.log(
        chalk.green('✅') +
          ' ' +
          chalk.gray(relativePath) +
          ' ' +
          chalk.dim(`(${result.oldVersion} → ${result.newVersion})`)
      )
    } else {
      errorCount++
      const relativePath = path.relative(process.cwd(), result.filePath)
      console.log(chalk.red('❌') + ' ' + chalk.gray(relativePath) + ' ' + chalk.red(`- ${result.error}`))
    }
  })

  // 显示汇总
  console.log(chalk.blue.bold('\n📊 汇总:'))
  console.log(chalk.green(`✅ 成功: ${successCount}`))
  if (errorCount > 0) {
    console.log(chalk.red(`❌ 失败: ${errorCount}`))
  }

  if (successCount > 0) {
    console.log(chalk.green('\n🎉 版本更新完成！'))
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.blue.bold('\n🚀 Package Version Updater\n'))

  // 验证版本号
  if (!validateVersion(version)) {
    console.error(chalk.red('❌ 无效的版本号格式！请使用语义化版本号，例如: 1.2.3'))
    process.exit(1)
  }

  const spinner = ora('正在查找package.json文件...').start()
  try {
    // 查找所有package.json文件
    const files = await glob('packages/**/package.json', {
      ignore: ['**/node_modules/**', '**/dist/**']
    })
    console.log(files)
    const packageJsonFiles = files
    if (packageJsonFiles.length === 0) {
      spinner.fail(chalk.yellow('⚠️  未找到任何package.json文件'))
      return
    }

    spinner.succeed(chalk.green(`✅ 找到 ${packageJsonFiles.length} 个package.json文件`))

    console.log(chalk.blue(`\n📝 将更新版本号为: ${chalk.bold(version)}\n`))

    // 更新文件
    const updateSpinner = ora('正在更新文件...').start()

    const updatePromises = packageJsonFiles.map((file) => updatePackageJson(file, version))

    const results = await Promise.all(updatePromises)

    updateSpinner.stop()

    // 显示结果
    displayResults(results)
  } catch (error) {
    spinner.fail(chalk.red('❌ 发生错误'))
    console.error(chalk.red(error.message))
    process.exit(1)
  }
}

// 运行主函数
main().catch((error) => {
  console.error(chalk.red('\n💥 未预期的错误:'), error)
  process.exit(1)
})
