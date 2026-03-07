import React, { useState, useEffect } from 'react';
import { requestForToken, onMessageListener } from '../firebase';
import { Toaster, toast } from 'react-hot-toast';

const Notifications = () => {
  const [notification, setNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    if (notification?.title) {
      toast(notification.title + "\n" + notification.body);
    }
  }, [notification]);

  useEffect(() => {
    requestForToken();

    onMessageListener()
      .then((payload: any) => {
        setNotification({
          title: payload?.notification?.title,
          body: payload?.notification?.body,
        });
      })
      .catch((err) => console.log('failed: ', err));
  }, []);

  return <Toaster />;
};

export default Notifications;
