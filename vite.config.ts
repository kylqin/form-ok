import path from 'path'
import * as reactPlugin from 'vite-plugin-react'
import type { UserConfig } from 'vite'

const alias = {
  '@core': path.resolve(__dirname, 'src/core'),
  '@rdr/react': path.resolve(__dirname, 'src/react')
}
const aliasReg = /^\/@core\/|\/@rdr\/react\//
const aliasReg2 = /^\/@modules\/@core\/|\/@rdr\/react\//

const config: UserConfig = {
  jsx: 'react',
  plugins: [reactPlugin],
  alias: {
    '/@/': path.resolve(__dirname, './src')
    // '/@core/': path.resolve(__dirname, './src/core'),
    // '/@rdr/react/': path.resolve(__dirname, './src/react')
  },
  // resolvers: [{
  //   requestToFile (req) {
  //     console.log('requestToFile: ', req)
  //     const matched = req.match(aliasReg)
  //     if (matched) {
  //       // console.log('matched', matched)
  //       const rw = req.replace(aliasReg, config.alias[matched[0]] + '/')
  //       console.log('rewrited     : ', rw)
  //       // return rw
  //     }
  //     const matched2 = req.match(aliasReg2)
  //     if (matched2) {
  //       console.log('matched2', matched2)
  //     }
  //   },
  //   fileToRequest (file, root) {
  //     // console.log('fileToRequest: ', file)
  //     // return file
  //   }
  // }],
  optimizeDeps: {
    include: ['antd', 'tui-calendar', 'moment', '@ant-design/icons'],
  },
  cssPreprocessOptions:{
    // antd需要开启这个才能引用 antd.less
    javascriptEnabled: true
  }
}

console.log('config ->', config)

export default config
