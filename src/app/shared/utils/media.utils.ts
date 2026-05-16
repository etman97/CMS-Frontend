const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

export function isVideoUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    if (url.includes('/video/upload/')) return true;
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    } catch {
        const lower = url.toLowerCase();
        return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
    }
}

export function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
}
