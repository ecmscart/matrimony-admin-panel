export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}
