import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { yt_html } from "../assets/assets";

const YTPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve parameters from router state
    const state = location.state as { image_url?: string; title?: string } | null;
    const thumbnailImg = state?.image_url || "https://picsum.photos/600/340?4";
    const videoTitle = state?.title || "How to Build a Full-Stack YouTube Clone with MERN";

    // Inject parameters into the youtube template html string
    const replacedHtml = yt_html
        .replace("%%THUMBNAIL_URL%%", thumbnailImg)
        .replace("%%TITLE%%", videoTitle);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#0f0f0f]">
            {/* Floating Back Action Button */}
            <button
                onClick={() => navigate(-1)}
                className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold rounded-full shadow-2xl shadow-pink-600/30 border border-pink-500/35 transition active:scale-95 cursor-pointer"
            >
                <ArrowLeft className="size-4" />
                <span>Exit Preview</span>
            </button>

            {/* Sandbox iframe for YT layout */}
            <iframe
                srcDoc={replacedHtml}
                className="w-full h-full border-none"
                title="YouTube Preview Simulator"
                sandbox="allow-scripts"
            />
        </div>
    );
};

export default YTPreview;