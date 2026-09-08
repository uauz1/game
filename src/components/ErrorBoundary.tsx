import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Qaddha render error', error, info);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="fatal-error" dir="rtl"><AlertTriangle/><span>صار شيء غير متوقع</span><h1>قدّها تحتاج تحديث سريع</h1><p>بياناتك المحلية ما انحذفت. حدّث الصفحة، وإذا استمرت المشكلة ارجع للرئيسية.</p><div><button className="primary" onClick={() => location.reload()}><RotateCcw/> تحديث الصفحة</button><a className="quiet" href="/">العودة للرئيسية</a></div></main>;
  }
}
