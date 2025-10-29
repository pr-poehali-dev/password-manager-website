import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface PasswordEntry {
  id: string;
  site: string;
  login: string;
  password: string;
  recoveryCode?: string;
  createdAt: number;
}

const Index = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    site: '',
    login: '',
    password: '',
    recoveryCode: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('passwordEntries');
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  const saveToLocalStorage = (data: PasswordEntry[]) => {
    localStorage.setItem('passwordEntries', JSON.stringify(data));
  };

  const handleAddEntry = () => {
    if (!formData.site || !formData.login || !formData.password) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    const newEntry: PasswordEntry = {
      id: Date.now().toString(),
      site: formData.site,
      login: formData.login,
      password: formData.password,
      recoveryCode: formData.recoveryCode,
      createdAt: Date.now()
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveToLocalStorage(updatedEntries);

    setFormData({ site: '', login: '', password: '', recoveryCode: '' });
    setIsAddDialogOpen(false);

    toast({
      title: 'Успешно',
      description: 'Пароль добавлен'
    });
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    saveToLocalStorage(updatedEntries);

    toast({
      title: 'Удалено',
      description: 'Запись удалена'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Скопировано',
      description: `${label} скопирован в буфер обмена`
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEntries = entries.filter(entry =>
    entry.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Менеджер Паролей</h1>
              <p className="text-muted-foreground text-sm">Надежное хранение данных</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative flex-1">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по сайту или логину..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 h-12">
                  <Icon name="Plus" size={20} />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Добавить новую запись</DialogTitle>
                  <DialogDescription>
                    Заполните данные для сохранения
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="site">Сайт / Приложение *</Label>
                    <Input
                      id="site"
                      placeholder="example.com"
                      value={formData.site}
                      onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login">Логин / Почта / Телефон *</Label>
                    <Input
                      id="login"
                      placeholder="user@example.com"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery">Код восстановления</Label>
                    <Textarea
                      id="recovery"
                      placeholder="Необязательно"
                      value={formData.recoveryCode}
                      onChange={(e) => setFormData({ ...formData, recoveryCode: e.target.value })}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddEntry} className="w-full">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredEntries.length === 0 && !searchQuery && (
            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Icon name="Lock" size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Пока нет сохраненных паролей</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Начните добавлять записи для безопасного хранения
                </p>
              </CardContent>
            </Card>
          )}

          {filteredEntries.length === 0 && searchQuery && (
            <Card className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Icon name="SearchX" size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Ничего не найдено</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {filteredEntries.map((entry, index) => (
              <Card key={entry.id} className="animate-fade-in hover-scale" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon name="Globe" size={20} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{entry.site}</CardTitle>
                        <CardDescription>{entry.login}</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Icon name="Trash2" size={18} className="text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                      {showPassword[entry.id] ? entry.password : '••••••••••••'}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => togglePasswordVisibility(entry.id)}
                    >
                      <Icon name={showPassword[entry.id] ? 'EyeOff' : 'Eye'} size={18} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(entry.password, 'Пароль')}
                    >
                      <Icon name="Copy" size={18} />
                    </Button>
                  </div>

                  {entry.recoveryCode && (
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Код восстановления</Label>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-xs whitespace-pre-wrap break-all">
                          {entry.recoveryCode}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(entry.recoveryCode!, 'Код восстановления')}
                        >
                          <Icon name="Copy" size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="ShieldCheck" size={16} />
            <span>Все данные хранятся локально в вашем браузере</span>
          </div>
          <p>Никакая информация не передается на сервер</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
