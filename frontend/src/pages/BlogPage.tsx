/**
 * BlogPage - public blog listing with category filters.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Eye, ArrowRight, Tag } from 'lucide-react';
import api from '../services/api';
import Header from '../components/Header';
import TrackomLogo from '../components/TrackomLogo';
import Footer from '../components/Footer';

interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  cover_image_url: string | null; author_name: string; view_count: number;
  published_at: string | null; created_at: string;
  category: { name: string; slug: string } | null;
}

// Seed posts for display until real blog content is created
const seedPosts: BlogPost[] = [
  { id: '1', title: 'How to Boost Customer Engagement with Bulk SMS', slug: 'boost-engagement-bulk-sms', excerpt: 'Learn proven strategies for increasing open rates and customer engagement through targeted SMS campaigns in Kenya.', cover_image_url: null, author_name: 'Trackom Team', view_count: 1240, published_at: '2026-06-20T10:00:00Z', created_at: '2026-06-20T10:00:00Z', category: { name: 'Marketing', slug: 'marketing' } },
  { id: '2', title: 'Getting Started with the Trackom SMS API', slug: 'getting-started-sms-api', excerpt: 'A developer guide to integrating Trackom\'s REST API into your application. Send your first SMS in under 5 minutes.', cover_image_url: null, author_name: 'Trackom Team', view_count: 890, published_at: '2026-06-18T10:00:00Z', created_at: '2026-06-18T10:00:00Z', category: { name: 'Developer', slug: 'developer' } },
  { id: '3', title: 'M-Pesa Integration for SMS Top-Ups', slug: 'mpesa-integration-topups', excerpt: 'How to automate your SMS credit purchases using M-Pesa STK push for seamless billing.', cover_image_url: null, author_name: 'Trackom Team', view_count: 650, published_at: '2026-06-15T10:00:00Z', created_at: '2026-06-15T10:00:00Z', category: { name: 'Product', slug: 'product' } },
  { id: '4', title: 'SMS Compliance in Kenya: CA Regulations Guide', slug: 'sms-compliance-kenya', excerpt: 'Everything you need to know about CA Kenya regulations, DND lists, and maintaining SMS compliance.', cover_image_url: null, author_name: 'Trackom Team', view_count: 2100, published_at: '2026-06-10T10:00:00Z', created_at: '2026-06-10T10:00:00Z', category: { name: 'Compliance', slug: 'compliance' } },
];

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-500/10 text-purple-500',
  Developer: 'bg-blue-500/10 text-blue-500',
  Product: 'bg-brand-primary/10 text-brand-primary',
  Compliance: 'bg-amber-500/10 text-amber-500',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(seedPosts);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/blog/posts?limit=20').then(r => { if (r.data.length > 0) setPosts(r.data); }).catch(() => {});
  }, []);

  const categories = ['all', ...new Set(posts.map(p => p.category?.name).filter(Boolean))];
  const filtered = filter === 'all' ? posts : posts.filter(p => p.category?.name === filter);

  return (
    <div className="min-h-screen bg-[#F3F4FD] dark:bg-surface-dark">
      <Header />

      <section className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-primary/10 text-brand-primary font-mono mb-4">
            <Tag className="w-3 h-3" /> BLOG
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white">Insights & Resources</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">Guides, tutorials, and best practices for SMS marketing, API integration, and business communications in Kenya.</p>
        </motion.div>

        {/* Category filters */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c as string)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-all ${filter === c ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}>
              {c === 'all' ? 'All Posts' : c}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((post, i) => (
            <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group">
              {/* Gradient header */}
              <div className="h-36 bg-gradient-to-br from-brand-primary/20 via-brand-accent/10 to-transparent relative">
                <div className="absolute inset-0 dot-grid opacity-30" />
                {post.category && (
                  <span className={`absolute top-4 left-4 px-2.5 py-1 rounded-md text-[10px] font-bold ${categoryColors[post.category.name] || 'bg-slate-100 text-slate-500'}`}>
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="p-6 space-y-3">
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors leading-snug">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.published_at ? new Date(post.published_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count.toLocaleString()}</span>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
