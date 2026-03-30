import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import JournalContent from '../components/JournalContent';
import { getPublishedBlogByIdentifier } from '../services/api';

function formatDate(value) {
  if (!value) {
    return '';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const BlogDetail = () => {
  const { blogId } = useParams();
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchBlog() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getPublishedBlogByIdentifier(blogId);

        if (isMounted) {
          setBlog(data.blog || null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Could not load this article right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBlog();

    return () => {
      isMounted = false;
    };
  }, [blogId]);

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen bg-bgLight flex items-center justify-center px-4">
        <p className="text-textGrey text-lg">Loading article...</p>
      </div>
    );
  }

  if (errorMessage || !blog) {
    return (
      <div className="pt-24 min-h-screen bg-bgLight flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xl text-center">
          <h1 className="font-serif text-3xl text-primary mb-3">Article Not Available</h1>
          <p className="text-textGrey mb-6">{errorMessage || 'This article could not be found.'}</p>
          <Link to="/blog" className="inline-flex items-center bg-accent text-white px-6 py-3 rounded-luxury">
            Back to Knowledge Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-24 bg-bgLight min-h-screen">
      <section className="relative h-[45vh] sm:h-[50vh] min-h-[320px] overflow-hidden">
        <img
          src={blog.imageUrl}
          alt={blog.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/20" />
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <span className="inline-block bg-accent text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-4">
              {blog.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-bold max-w-4xl leading-tight">
              {blog.title}
            </h1>
            <p className="mt-4 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-sm sm:text-base text-white shadow-lg backdrop-blur-md">
              <span className="whitespace-nowrap">{formatDate(blog.publishedAt)}</span>
              {blog.author ? (
                <span className="whitespace-nowrap text-white/90">• {blog.author}</span>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <section className="relative -mt-4 sm:-mt-8 lg:-mt-12 pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 shadow-xl"
          >
            <p className="text-base sm:text-lg text-textGrey leading-8 border-l-4 border-accent pl-4 sm:pl-5 mb-8 sm:mb-10">
              {blog.excerpt}
            </p>
            <JournalContent content={blog.content} />
          </motion.article>

          <div className="text-center mt-8 sm:mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-luxury hover:bg-opacity-90 transition-colors"
            >
              Explore More Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;
