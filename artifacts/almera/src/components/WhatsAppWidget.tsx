import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppWidget() {
  const phoneNumber = '923001234567'; 
  const message = encodeURIComponent('Hi! I have a question about your products.');

  return (
    <motion.a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-black/20"
      style={{ backgroundColor: '#25D366' }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} className="text-white" />
    </motion.a>
  );
}
