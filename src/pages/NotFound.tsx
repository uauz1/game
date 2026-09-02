import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="text-center p-8 max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-purple/20 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-10 h-10 text-purple" />
        </div>
        <h1 className="text-3xl font-cairo font-black mb-2">404</h1>
        <p className="text-off-white/60 mb-6">الصفحة التي تبحث عنها غير موجودة</p>
        <Button variant="primary" size="lg" onClick={() => navigate('/')}>
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </Button>
      </Card>
    </div>
  );
}
