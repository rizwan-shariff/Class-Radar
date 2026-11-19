'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  ShieldCheck, 
  Compass, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorUsn: string;
}

interface Post {
  id: string;
  content: string;
  category: 'ACADEMIC' | 'CAMPUS' | 'DOUBT' | 'EVENT';
  createdAt: string;
  authorName: string;
  authorUsn: string;
  likesCount: number;
  isLiked: boolean;
  comments: Comment[];
}

export default function StudentCommunityFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ACADEMIC' | 'CAMPUS' | 'DOUBT' | 'EVENT'>('ACADEMIC');
  const [submitting, setSubmitting] = useState(false);

  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchPosts = async () => {
    try {
      setError(null);
      const res = await api.community.getPosts();
      if (res?.posts) {
        setPosts(res.posts);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load community feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      fetchPosts();
    }
  }, [user]);

  if (user && user.role !== 'STUDENT') {
    return (
      <div className="max-w-md mx-auto my-24 p-8 rounded-3xl bg-white/85 backdrop-blur-xl ring-1 ring-black/[0.04] text-center">
        <ShieldCheck className="w-12 h-12 text-[#6C5939] dark:text-[#8AB4F8] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#1B1C19] dark:text-white">Student Community Exclusive</h2>
        <p className="text-sm text-[#4C463C] dark:text-slate-300 mt-2">
          This community feed is strictly restricted to students for peer coordination and updates.
        </p>
      </div>
    );
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await api.community.createPost({
        content: newPostContent.trim(),
        category: selectedCategory,
      });
      if (res?.post) {
        setPosts([res.post, ...posts]);
        setNewPostContent('');
      }
    } catch (err: any) {
      alert(err?.message || 'Could not post to feed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }
      return p;
    }));

    try {
      await api.community.toggleLike(postId);
    } catch {
      fetchPosts();
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!replyText.trim() || replying) return;

    setReplying(true);
    try {
      const res = await api.community.addComment(postId, replyText.trim());
      if (res?.comment) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...p.comments, res.comment],
            };
          }
          return p;
        }));
        setReplyText('');
        setActiveReplyPostId(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit reply.');
    } finally {
      setReplying(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Specular Ambient Cream Glows (matching Student Dashboard exactly) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[36rem] h-[36rem] rounded-full bg-[#EAE1D4]/40 dark:bg-[#1A73E8]/8 blur-[100px] transform -translate-x-1/2" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#F9DFB5]/25 dark:bg-[#8AB4F8]/6 blur-[120px]" />
        <div className="absolute -bottom-24 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#F0EEE9]/60 dark:bg-[#1A73E8]/5 blur-[90px]" />
      </div>

      {/* Editorial Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#CFC5B8]/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6C5939] dark:bg-[#8AB4F8] animate-pulse" />
            <span className="text-[11px] font-bold text-[#86724F] dark:text-[#8AB4F8] uppercase tracking-wider">
              Student Network · CSE-3F North Campus
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1C19] dark:text-white tracking-tight">
            Peer Community Feed
          </h1>
          <p className="text-xs sm:text-sm text-[#4C463C] dark:text-slate-300">
            Real-time peer discussions, doubts, lab notices, and campus updates.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EEE9] dark:bg-white/10 border border-white/80 dark:border-white/10 text-xs font-semibold text-[#4C463C] dark:text-slate-300 shadow-sm self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-[#6C5939] dark:text-[#8AB4F8]" />
          <span>Verified Student Space</span>
        </div>
      </section>

      {/* Post Composer: Matches the Clean White/Cream Card Architecture */}
      <div className="rounded-3xl bg-white/85 dark:bg-[#202227]/90 backdrop-blur-xl p-6 shadow-sm hover:shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.08] transition-all space-y-4">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6C5939] to-[#86724F] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1B1C19] dark:text-white">{user?.name || 'Student'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F0EEE9] dark:bg-white/10 text-[#635E53] dark:text-slate-300 font-semibold">
                  {(user as any)?.usn || 'CSE-3F'}
                </span>
              </div>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share a campus update, ask about lab experiments, or coordinate study groups..."
                rows={3}
                className="w-full bg-[#F6F3EE]/80 dark:bg-white/5 border border-[#CFC5B8]/50 dark:border-white/10 rounded-2xl p-3.5 text-sm text-[#1B1C19] dark:text-white placeholder-[#7E766B] dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30 transition resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#CFC5B8]/30 dark:border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {(['ACADEMIC', 'CAMPUS', 'DOUBT', 'EVENT'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                    selectedCategory === cat 
                      ? 'bg-[#6C5939] text-white shadow-sm' 
                      : 'bg-[#F0EEE9] dark:bg-white/10 text-[#635E53] dark:text-slate-300 hover:bg-[#E5E2DD] dark:hover:bg-white/15'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!newPostContent.trim() || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-40"
            >
              <span>{submitting ? 'Publishing...' : 'Share with Peers'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-[#6C5939] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#7E766B] dark:text-slate-400 font-semibold uppercase tracking-wider">Syncing Campus Feed...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl bg-white/85 dark:bg-[#202227]/90 backdrop-blur-xl ring-1 ring-black/[0.04] dark:ring-white/[0.08] text-center py-16 px-6 space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#E7DFD1] text-[#6C5939] flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#1B1C19] dark:text-white">No Posts Yet in CSE-3F</h3>
          <p className="text-xs text-[#7E766B] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Be the first student to post an update, start a discussion, or share class notes!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article 
              key={post.id} 
              className="group rounded-3xl bg-white/85 dark:bg-[#202227]/90 backdrop-blur-xl p-6 shadow-sm hover:shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.08] transition-all relative overflow-hidden space-y-3.5"
            >
              {/* Warm Primary Spine accent */}
              <div className="absolute inset-y-0 left-0 w-1.5 bg-[#6C5939]" />

              {/* Post Header */}
              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#E7DFD1] dark:bg-white/10 text-[#6C5939] dark:text-[#8AB4F8] flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {post.authorName ? post.authorName.charAt(0) : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1B1C19] dark:text-white">{post.authorName}</span>
                      {post.authorUsn && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F0EEE9] dark:bg-white/10 text-[#635E53] dark:text-slate-300 font-semibold">
                          {post.authorUsn}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#7E766B] dark:text-slate-400 mt-0.5">
                      <span>{formatTimestamp(post.createdAt)}</span>
                      <span>•</span>
                      <span className="text-[#6C5939] dark:text-[#8AB4F8] font-bold">#{post.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Text */}
              <p className="text-sm text-[#1B1C19] dark:text-slate-200 leading-relaxed pl-14 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Actions Bar */}
              <div className="flex items-center gap-6 pt-2 pl-14 text-xs font-medium text-[#7E766B] dark:text-slate-400 border-t border-[#CFC5B8]/30 dark:border-white/10">
                <button 
                  onClick={() => handleToggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    post.isLiked ? 'text-[#BA1A1A] font-bold' : 'hover:text-[#BA1A1A]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-[#BA1A1A] text-[#BA1A1A]' : ''}`} />
                  <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
                </button>

                <button 
                  onClick={() => setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)}
                  className="inline-flex items-center gap-1.5 hover:text-[#6C5939] dark:hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comments?.length || 0} {post.comments?.length === 1 ? 'Reply' : 'Replies'}</span>
                </button>
              </div>

              {/* Inline Reply Input */}
              {activeReplyPostId === post.id && (
                <div className="pl-14 pt-2 animate-in fade-in duration-150">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${post.authorName}...`}
                      className="flex-1 bg-[#F6F3EE]/80 dark:bg-white/5 border border-[#CFC5B8]/60 dark:border-white/10 px-3.5 py-2 rounded-2xl text-xs text-[#1B1C19] dark:text-white placeholder-[#7E766B] focus:outline-none focus:ring-2 focus:ring-[#6C5939]/30"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={!replyText.trim() || replying}
                      className="px-4 py-2 rounded-2xl bg-[#6C5939] hover:bg-[#554425] text-white text-xs font-bold transition disabled:opacity-40 shadow-sm"
                    >
                      {replying ? 'Sending...' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments Thread Spine */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 pl-10 sm:pl-12 space-y-2.5 relative">
                  <div className="absolute left-14 top-0 bottom-3 w-0.5 bg-[#CFC5B8]/40 dark:bg-white/10 rounded-full" />
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="relative pl-6 pt-1 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-[#E7DFD1] dark:bg-white/10 text-[#6C5939] dark:text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 shadow-xs">
                        {comment.authorName ? comment.authorName.charAt(0) : 'S'}
                      </div>
                      <div className="flex-1 bg-[#F6F3EE]/80 dark:bg-white/[0.04] p-3 rounded-2xl border border-[#CFC5B8]/40 dark:border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1B1C19] dark:text-white">{comment.authorName}</span>
                            {comment.authorUsn && (
                              <span className="text-[10px] font-mono text-[#7E766B] dark:text-slate-400">{comment.authorUsn}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#7E766B] dark:text-slate-400">{formatTimestamp(comment.createdAt)}</span>
                        </div>
                        <p className="text-xs text-[#4C463C] dark:text-slate-300 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
