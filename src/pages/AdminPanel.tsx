import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_API_URL = 'https://functions.poehali.dev/e63d2e57-6f6f-4b53-87a7-36038c10214b';

interface Stats {
  total_phones: number;
  total_searches: number;
  successful_searches: number;
  top_searches: Array<{ phone: string; count: number }>;
}

const AdminPanel = () => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadData, setUploadData] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    const savedEmail = localStorage.getItem('admin_email');
    
    if (!savedToken) {
      navigate('/admin/login');
      return;
    }
    
    setToken(savedToken);
    setEmail(savedEmail);
    loadStats(savedToken);
  }, [navigate]);

  const loadStats = async (authToken: string) => {
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=stats`, {
        headers: {
          'X-Auth-Token': authToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    navigate('/admin/login');
  };

  const handleUpload = async () => {
    if (!uploadData.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите данные для загрузки',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const phones = JSON.parse(uploadData);
      
      if (!Array.isArray(phones)) {
        throw new Error('Данные должны быть массивом');
      }

      const response = await fetch(`${ADMIN_API_URL}?action=upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!,
        },
        body: JSON.stringify({ phones }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно загружено',
          description: `Добавлено: ${data.inserted}, Обновлено: ${data.updated}`,
        });
        setUploadData('');
        loadStats(token!);
      } else {
        toast({
          title: 'Ошибка загрузки',
          description: data.error || 'Не удалось загрузить данные',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неверный формат JSON',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleData = `[
  {
    "phone": "+79991234567",
    "data": {
      "name": "Иван Иванов",
      "city": "Москва",
      "notes": "Дополнительная информация"
    }
  },
  {
    "phone": "+79997654321",
    "data": {
      "name": "Мария Петрова",
      "company": "ООО Компания",
      "email": "maria@example.com"
    }
  }
]`;

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Icon name="Database" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Админ-панель</h1>
              <p className="text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </header>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats" className="gap-2">
              <Icon name="BarChart3" size={18} />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Icon name="Upload" size={18} />
              Загрузка базы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Всего номеров</CardDescription>
                  <CardTitle className="text-3xl">{stats?.total_phones || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Phone" size={16} />
                    В базе данных
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Всего поисков</CardDescription>
                  <CardTitle className="text-3xl">{stats?.total_searches || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Search" size={16} />
                    Запросов от пользователей
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Успешных поисков</CardDescription>
                  <CardTitle className="text-3xl">{stats?.successful_searches || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="CheckCircle2" size={16} />
                    {stats?.total_searches && stats?.successful_searches
                      ? `${Math.round((stats.successful_searches / stats.total_searches) * 100)}%`
                      : '0%'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats?.top_searches && stats.top_searches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Топ поисковых запросов</CardTitle>
                  <CardDescription>Самые популярные номера</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.top_searches.map((item, index) => (
                      <div
                        key={item.phone}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-mono">{item.phone}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} запросов</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Загрузка базы данных</CardTitle>
                <CardDescription>
                  Вставьте JSON массив с номерами телефонов и данными
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JSON данные</Label>
                  <Textarea
                    placeholder={exampleData}
                    value={uploadData}
                    onChange={(e) => setUploadData(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpload} disabled={loading}>
                    {loading ? (
                      <>
                        <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Icon name="Upload" size={18} className="mr-2" />
                        Загрузить
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadData(exampleData)}
                  >
                    <Icon name="FileCode" size={18} className="mr-2" />
                    Показать пример
                  </Button>
                </div>

                <Card className="bg-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Формат данных</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>phone</strong> — номер телефона (строка, начинается с +7 или 8)
                    </p>
                    <p>
                      <strong>data</strong> — объект с любыми дополнительными полями (имя, город, email и т.д.)
                    </p>
                    <p className="text-muted-foreground">
                      Если номер уже существует, данные будут обновлены
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
