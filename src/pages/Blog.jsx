import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getPublishedBlogs, postNewsletterSubscription } from '../services/api';

function formatDate(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  useEffect(() => {
    let isMounted = true;

    async function fetchPosts() {
      setIsLoadingPosts(true);
      setPostsError('');

      try {
        const data = await getPublishedBlogs();

        if (isMounted) {
          setPosts(data.blogs || []);
        }
      } catch (error) {
        if (isMounted) {
          setPostsError(error.message || 'Could not load blogs right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    }

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      return;
    }

    setNewsletterStatus('submitting');

    try {
      await postNewsletterSubscription({
        email: newsletterEmail,
        source: 'blog',
      });
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch (_error) {
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="pt-20 sm:pt-24">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Knowledge Hub
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Insights, tips, and updates from the world of real estate and luxury living.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoadingPosts && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[0, 1, 2].map((item) => (
                <div key={item} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingPosts && postsError && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-red-600">{postsError}</p>
            </div>
          )}

          {!isLoadingPosts && !postsError && posts.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <p className="text-textGrey">No articles yet. Please check back soon.</p>
            </div>
          )}

          {!isLoadingPosts && !postsError && posts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                      <span className="bg-accent text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <p className="text-textGrey text-xs sm:text-sm mb-2 sm:mb-3">{formatDate(post.publishedAt)}</p>
                    <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2 sm:mb-3 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-textGrey text-sm sm:text-base mb-3 sm:mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <Link
                      to={`/blog/${post.slug || post.id}`}
                      className="inline-flex items-center text-accent font-medium hover:underline text-sm sm:text-base"
                    >
                      Read More
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary text-white rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 text-center"
          >
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto">
              Get the latest updates on new projects, real estate tips, and exclusive offers delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-luxury text-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'submitting'}
                className="bg-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium whitespace-nowrap text-sm sm:text-base disabled:opacity-70"
              >
                {newsletterStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="text-green-300 text-sm mt-4">Subscribed successfully.</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-red-300 text-sm mt-4">Could not subscribe right now.</p>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
