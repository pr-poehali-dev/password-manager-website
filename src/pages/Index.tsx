import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface PasswordEntry {
  id: string;
  site: string;
  login: string;
  password: string;
  recoveryCode?: string;
  category: string;
  createdAt: number;
}

interface Category {
  value: string;
  label: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { value: 'work', label: 'Работа', icon: 'Briefcase' },
  { value: 'personal', label: 'Личное', icon: 'User' },
  { value: 'finance', label: 'Финансы', icon: 'CreditCard' },
  { value: 'social', label: 'Соцсети', icon: 'MessageCircle' },
  { value: 'other', label: 'Другое', icon: 'FolderOpen' }
];

const AVAILABLE_ICONS = [
  'Briefcase', 'User', 'CreditCard', 'MessageCircle', 'FolderOpen', 
  'Globe', 'Lock', 'Key', 'Mail', 'Phone', 'ShoppingCart', 
  'Home', 'Music', 'Video', 'Book', 'Heart', 'Star', 'Zap'
];

const Index = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    site: '',
    login: '',
    password: '',
    recoveryCode: '',
    category: 'personal'
  });

  const [categoryFormData, setCategoryFormData] = useState({
    label: '',
    icon: 'FolderOpen'
  });

  useEffect(() => {
    const storedEntries = localStorage.getItem('passwordEntries');
    const storedCategories = localStorage.getItem('passwordCategories');
    
    if (storedEntries) {
      const parsed = JSON.parse(storedEntries);
      const migratedEntries = parsed.map((entry: any) => ({
        ...entry,
        category: entry.category || 'other'
      }));
      setEntries(migratedEntries);
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }
  }, []);

  const saveToLocalStorage = (data: PasswordEntry[]) => {
    localStorage.setItem('passwordEntries', JSON.stringify(data));
  };

  const saveCategoriesToLocalStorage = (data: Category[]) => {
    localStorage.setItem('passwordCategories', JSON.stringify(data));
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

    if (editingEntry) {
      const updatedEntries = entries.map(entry =>
        entry.id === editingEntry.id
          ? { ...entry, ...formData }
          : entry
      );
      setEntries(updatedEntries);
      saveToLocalStorage(updatedEntries);
      toast({
        title: 'Обновлено',
        description: 'Запись успешно обновлена'
      });
    } else {
      const newEntry: PasswordEntry = {
        id: Date.now().toString(),
        site: formData.site,
        login: formData.login,
        password: formData.password,
        recoveryCode: formData.recoveryCode,
        category: formData.category,
        createdAt: Date.now()
      };

      const updatedEntries = [...entries, newEntry];
      setEntries(updatedEntries);
      saveToLocalStorage(updatedEntries);

      toast({
        title: 'Успешно',
        description: 'Пароль добавлен'
      });
    }

    setFormData({ site: '', login: '', password: '', recoveryCode: '', category: 'personal' });
    setIsAddDialogOpen(false);
    setEditingEntry(null);
  };

  const handleAddCategory = () => {
    if (!categoryFormData.label) {
      toast({
        title: 'Ошибка',
        description: 'Введите название категории',
        variant: 'destructive'
      });
      return;
    }

    if (editingCategory) {
      const updatedCategories = categories.map(cat =>
        cat.value === editingCategory.value
          ? { ...cat, label: categoryFormData.label, icon: categoryFormData.icon }
          : cat
      );
      setCategories(updatedCategories);
      saveCategoriesToLocalStorage(updatedCategories);
      toast({
        title: 'Обновлено',
        description: 'Категория успешно обновлена'
      });
    } else {
      const newCategory: Category = {
        value: `custom_${Date.now()}`,
        label: categoryFormData.label,
        icon: categoryFormData.icon
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      saveCategoriesToLocalStorage(updatedCategories);

      toast({
        title: 'Успешно',
        description: 'Категория добавлена'
      });
    }

    setCategoryFormData({ label: '', icon: 'FolderOpen' });
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      label: category.label,
      icon: category.icon
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryValue: string) => {
    const entriesInCategory = entries.filter(e => e.category === categoryValue).length;
    
    if (entriesInCategory > 0) {
      toast({
        title: 'Ошибка',
        description: `В этой категории ${entriesInCategory} записей. Сначала удалите их или переместите в другую категорию.`,
        variant: 'destructive'
      });
      return;
    }

    const updatedCategories = categories.filter(cat => cat.value !== categoryValue);
    setCategories(updatedCategories);
    saveCategoriesToLocalStorage(updatedCategories);

    if (selectedCategory === categoryValue) {
      setSelectedCategory('all');
    }

    toast({
      title: 'Удалено',
      description: 'Категория удалена'
    });
  };

  const handleEditEntry = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setFormData({
      site: entry.site,
      login: entry.login,
      password: entry.password,
      recoveryCode: entry.recoveryCode || '',
      category: entry.category
    });
    setIsAddDialogOpen(true);
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

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
      setFormData({ site: '', login: '', password: '', recoveryCode: '', category: 'personal' });
    }
  };

  const handleCategoryDialogClose = (open: boolean) => {
    setIsCategoryDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
      setCategoryFormData({ label: '', icon: 'FolderOpen' });
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.login.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (category: string) => {
    return entries.filter(e => e.category === category).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Icon name="ShieldCheck" size={32} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">Менеджер Паролей</h1>
              <p className="text-muted-foreground">Надежное хранение данных</p>
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
                className="pl-10 h-12 border-2 focus-visible:ring-2"
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 h-12 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                  <Icon name="Plus" size={20} />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? 'Редактировать запись' : 'Добавить новую запись'}</DialogTitle>
                  <DialogDescription>
                    {editingEntry ? 'Внесите изменения в запись' : 'Заполните данные для сохранения'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon name={cat.icon as any} size={16} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    {editingEntry ? 'Обновить' : 'Сохранить'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
                <TabsTrigger value="all" className="gap-2">
                  <Icon name="Layers" size={16} />
                  Все ({entries.length})
                </TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value} className="gap-2 group relative">
                    <Icon name={cat.icon as any} size={16} />
                    {cat.label} ({getCategoryCount(cat.value)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={handleCategoryDialogClose}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="ml-4">
                  <Icon name="Settings" size={18} />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Измените название или иконку' : 'Создайте свою категорию'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryLabel">Название *</Label>
                    <Input
                      id="categoryLabel"
                      placeholder="Название категории"
                      value={categoryFormData.label}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryIcon">Иконка *</Label>
                    <Select value={categoryFormData.icon} onValueChange={(value) => setCategoryFormData({ ...categoryFormData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {AVAILABLE_ICONS.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              <Icon name={icon as any} size={16} />
                              {icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddCategory} className="w-full">
                    {editingCategory ? 'Обновить' : 'Создать'}
                  </Button>

                  {categories.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-sm font-semibold mb-3 block">Управление категориями</Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {categories.map(cat => (
                          <div key={cat.value} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                            <div className="flex items-center gap-2">
                              <Icon name={cat.icon as any} size={16} />
                              <span className="text-sm">{cat.label}</span>
                              <span className="text-xs text-muted-foreground">({getCategoryCount(cat.value)})</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditCategory(cat)}
                              >
                                <Icon name="Pencil" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteCategory(cat.value)}
                              >
                                <Icon name="Trash2" size={14} className="text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredEntries.length === 0 && !searchQuery && (
            <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
            {filteredEntries.map((entry, index) => {
              const category = categories.find(c => c.value === entry.category);
              return (
                <Card key={entry.id} className="animate-fade-in hover-scale border-l-4 border-l-primary/40" style={{ animationDelay: `${0.05 * (index + 1)}s` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                          <Icon name={category?.icon as any || 'Globe'} size={22} className="text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-semibold">{entry.site}</CardTitle>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {category?.label}
                            </span>
                          </div>
                          <CardDescription className="text-sm">{entry.login}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEntry(entry)}
                          className="hover:bg-primary/10"
                        >
                          <Icon name="Pencil" size={16} className="text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="hover:bg-destructive/10"
                        >
                          <Icon name="Trash2" size={16} className="text-destructive" />
                        </Button>
                      </div>
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
              );
            })}
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
