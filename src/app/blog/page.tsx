import React from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { Calendar, User, Tag } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      id: '1',
      title: 'Современные тренды в геометаллургии: интеграция данных и машинное обучение',
      excerpt: 'Как искусственный интеллект и анализ больших данных меняют подход к геометаллургическому моделированию месторождений...',
      date: '15 марта 2024',
      category: 'Технологии',
      author: 'Александр Петров'
    },
    {
      id: '2',
      title: 'Оптимизация баланса металлов: практические кейсы и решения',
      excerpt: 'Разбор реальных примеров повышения точности учета металлов на обогатительных фабриках и выявления скрытых потерь...',
      date: '28 февраля 2024',
      category: 'Практика',
      author: 'Елена Смирнова'
    },
    {
      id: '3',
      title: 'Влияние минералогии на выбор технологии флотации',
      excerpt: 'Как детальное изучение минералогического состава руды позволяет подобрать оптимальные реагентные режимы и повысить извлечение...',
      date: '10 февраля 2024',
      category: 'Исследования',
      author: 'Александр Петров'
    }
  ];

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Блог и новости</h1>
          <p className="text-xl text-secondary-200 max-w-3xl">
            Экспертные статьи, аналитика и новости из мира геометаллургии и обогащения руд
          </p>
        </Container>
      </section>

      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="flex flex-col hover:shadow-2xl transition-shadow duration-300">
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    <Tag className="h-3 w-3" />
                    {post.category}
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-3 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
                  {post.title}
                </h2>

                <p className="text-secondary-600 mb-6 flex-grow line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between text-sm text-secondary-500 pt-4 border-t border-secondary-200">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-secondary-500 mb-4">Скоро здесь появятся новые статьи</p>
            <p className="text-secondary-400 text-sm">Подпишитесь на нашу рассылку, чтобы не пропустить обновления</p>
          </div>
        </Container>
      </section>
    </div>
  );
}
