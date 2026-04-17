import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
  machineName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * MachineErrorBoundary - A specialized error boundary for individual AI Factory machines.
 * Ensures that a failure in one machine doesn't bring down the entire factory.
 */
export class MachineErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Factory Machine Error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-12 text-center bg-dark-light/50 backdrop-blur-xl border border-red-500/20 rounded-[3rem] space-y-6" dir="rtl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="text-red-500 w-10 h-10 animate-bounce" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white italic">
              عذراً، تعطلت ماكينة <span className="text-red-400">{this.props.machineName || 'الذكاء الاصطناعي'}</span> ⚙️
            </h2>
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md mx-auto">
              يبدو أن الماكينة واجهت ضغطاً غير متوقع أو مشكلة في المحرك الرقمي. لا تقلق، يمكنك إعادة تشغيلها بضغطة زر.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={this.handleRetry}
              variant="default"
              className="px-8 py-6 rounded-2xl bg-gradient-to-r from-red-600 to-primary hover:scale-105 transition-all font-black text-base shadow-[0_0_20px_rgba(124,92,252,0.3)]"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              إعادة التشغيل (Retry)
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-8 py-6 rounded-2xl border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all font-bold"
            >
              تحديث الصفحة بالكامل
            </Button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 bg-black/60 rounded-2xl border border-white/5 text-[10px] font-mono text-gray-500 text-left overflow-auto max-h-40 backdrop-blur-md">
              <span className="text-red-400/50 block mb-2 font-black uppercase tracking-widest">[DEBUG LOG]</span>
              {this.state.error.stack}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
