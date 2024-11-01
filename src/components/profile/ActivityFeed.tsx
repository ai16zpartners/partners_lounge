// components/profile/ActivityFeed.tsx
import { FC } from 'react';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { format } from 'date-fns';

export const ActivityFeed: FC = () => {
  const { activities, isLoading, hasMore, loadMore } = useActivityFeed();

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"/>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} 
                 className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-medium">{activity.type}</p>
                <p className="text-sm text-gray-600">
                  {format(activity.timestamp, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div className={`text-${activity.status === 'success' ? 'green' : 'red'}-600`}>
                {activity.amount && `${activity.amount} SOL`}
              </div>
            </div>
          ))}
          
          {hasMore && (
            <button 
              onClick={loadMore}
              className="w-full py-2 text-center text-gray-600 hover:text-gray-900"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};