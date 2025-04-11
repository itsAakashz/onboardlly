import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

const VideosTab = ({
  video,
  videos,
  handleAddVideo,
  setVideo,
  setVideos
}) => {
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="mt-6">
      {/* Add Video Form */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Video</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Video Title"
            value={video.title || ''}
            onChange={(e) => setVideo({ ...video, title: e.target.value })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="url"
            placeholder="YouTube or Video URL"
            value={video.url || ''}
            onChange={(e) => setVideo({ ...video, url: e.target.value })}
            className="w-full border px-3 py-2 rounded  text-gray-800 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>
      </div>

      {/* Videos List */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Video Tutorials</h3>
        {videos.length > 0 ? (
          <ul className="space-y-6">
            {videos.map((vid) => (
              <li key={vid.id} className="space-y-2">
                <p className="text-gray-800 font-medium">{vid.title}</p>
                <div className="aspect-video w-full">
                  <iframe
                    src={vid.url}
                    title={vid.title}
                    allowFullScreen
                    className="w-full h-64 rounded border"
                  ></iframe>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No videos available.</p>
        )}
      </div>
    </div>
  );
};

export default VideosTab;