import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import type { AuthLayoutProps } from '@/types';

export default function AuthLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <AuthSimpleLayout
            title={title}
            description={description}
        >
            {children}
        </AuthSimpleLayout>
    );
}
