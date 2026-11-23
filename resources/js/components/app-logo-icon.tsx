import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="MDRRMO emblem"
        >
            <path
                d="M24 3.5 41 10v12.1c0 10.5-7.1 18.3-17 22.4C14.1 40.4 7 32.6 7 22.1V10l17-6.5Z"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinejoin="round"
            />
            <path
                d="M21 12.5h6v8.5h8.5v6H27v8.5h-6V27h-8.5v-6H21v-8.5Z"
                fill="currentColor"
            />
        </svg>
    );
}
