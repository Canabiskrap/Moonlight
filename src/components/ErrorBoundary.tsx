import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-md w-full bg-dark-light p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">عذراً، حدث خطأ غير متوقع</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                لقد واجه النظام مشكلة تقنية. لا تقلق، يمكنك محاولة العودة للرئيسية أو تحديث الصفحة.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-mono text-gray-500 text-left overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} />
                تحديث الصفحة
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <Home size={18} />
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
