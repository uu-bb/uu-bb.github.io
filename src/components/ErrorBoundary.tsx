import { Component, type ErrorInfo, type ReactNode } from 'react'
import { assetPath } from '../utils/assets'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep diagnostics out of the public interface and build artifacts.
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="fatal-fallback">
        <p className="eyebrow">页面暂时没有完全醒来</p>
        <h1>杨皓博 · 睡醒实验室</h1>
        <p>你仍然可以查看简历或通过邮箱联系我。</p>
        <div className="button-row">
          <a href={assetPath('resume/yang-haobo-ai-product-application.pdf')}>
            查看综合简历
          </a>
          <a href="mailto:920816086@qq.com">发送邮件</a>
        </div>
      </main>
    )
  }
}
