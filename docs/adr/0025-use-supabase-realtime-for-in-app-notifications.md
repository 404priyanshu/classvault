# Use Supabase Realtime for In-App Notifications

For the MVP, ClassVault uses Supabase Realtime as the required delivery infrastructure for in-app notifications, while notification records themselves are persisted so students can view history, mark notifications as read, and clear them. This keeps realtime delivery aligned with the selected backend stack while leaving email notifications as a separate channel for important account and billing events.
