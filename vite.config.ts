import path from 'path'
import * as reactPlugin from 'vite-plugin-react'
import type { UserConfig } from 'vite'

const config: UserConfig = {
  jsx: 'react',
  plugins: [reactPlugin],
  alias: {
    '/@/': path.resolve(__dirname, '../src')
  },
  optimizeDeps: {
    include: ['antd', 'tui-calendar', 'moment', '@ant-design/icons'],
  },
  cssPreprocessOptions:{
    // antd需要开启这个才能引用 antd.less
    javascriptEnabled: true
  }
}

export default config
