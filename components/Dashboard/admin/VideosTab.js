import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { FiPlus, FiTrash2, FiYoutube, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

const VideosTab = ({
  video,
  videos,
  handleAddVideo,
  setVideo,
  setVideos
}) => {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'videos'), (snapshot) => {
      const videoList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideos(videoList);
    });
    return () => unsubscribe();
  }, [setVideos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video.title || !video.url) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'videos'), video);
      setVideo({ title: '', url: '' });
    } catch (err) {
      console.error("Error adding video:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (err) {
      console.error("Error deleting video:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="mt-6 space-y-8">
      {/* Add Video Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden p-6 border border-indigo-100"
      >
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <FiPlus size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Add New Video</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter video title"
              value={video.title || ''}
              onChange={(e) => setVideo({ ...video, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-black placeholder-gray-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiYoutube className="text-gray-400" />
              </div>
              <input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={video.url || ''}
                onChange={(e) => setVideo({ ...video, url: e.target.value })}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-black placeholder-gray-500"
                required
              />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center px-6 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md transition-all duration-200 ${loading ? 'opacity-80' : ''}`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Adding Video...
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  Add Video
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Videos List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <FiYoutube className="text-red-500 mr-3" size={24} />
            Video Tutorials
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {videos.length > 0 ? (
            videos.map((vid) => {
              const youtubeId = extractYouTubeId(vid.url);
              const embedUrl = youtubeId 
                ? `https://www.youtube.com/embed/${youtubeId}`
                : vid.url;
              
              return (
                <motion.div 
                  key={vid.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">{vid.title}</h4>
                    <button
                      onClick={() => handleDelete(vid.id)}
                      disabled={deletingId === vid.id}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 -mt-1 -mr-1"
                    >
                      {deletingId === vid.id ? (
                        <FiLoader className="animate-spin" />
                      ) : (
                        <FiTrash2 />
                      )}
                    </button>
                  </div>
                  
                  <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <iframe
                      src={embedUrl}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-64 md:h-80 lg:h-96"
                    />
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiYoutube className="text-gray-400" size={24} />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-1">No videos available</h4>
              <p className="text-gray-500">Add your first video using the form above</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VideosTab;