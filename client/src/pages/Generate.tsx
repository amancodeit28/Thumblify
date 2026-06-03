import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, Download, Eye, RefreshCw, Layers, Check } from "lucide-react";
import { aspectRatios, thumbnailStyles, colorSchemes } from "../assets/assets";
import type { IThumbnail, AspectRatio, ThumbnailStyle } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import { useAuth, API_BASE_URL, API_ORIGIN } from "../context/AuthContext";

const Generate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    // Form states
    const [title, setTitle] = useState("");
    const [additionalDetails, setAdditionalDetails] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
    const [style, setStyle] = useState<ThumbnailStyle>("Bold & Graphic");
    const [colorScheme, setColorScheme] = useState("vibrant");
    const [textOverlay, setTextOverlay] = useState(true);

    // Generation states
    const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if no token
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Fetch existing generation if ID is in parameters (for viewing details)
    useEffect(() => {
        const fetchThumbnail = async () => {
            if (!id || !token) return;
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/thumbnails/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setThumbnail(data);
                    // Prepopulate form
                    setTitle(data.title);
                    setAdditionalDetails(data.user_prompt || "");
                    setStyle(data.style);
                    setAspectRatio(data.aspect_ratio || "16:9");
                    setColorScheme(data.color_scheme || "vibrant");
                    setTextOverlay(!!data.text_overlay);
                }
            } catch (err) {
                console.error("Error loading thumbnail:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchThumbnail();
    }, [id, token]);

    // Helper to resolve backend image URL
    const getImageUrl = (url: string | undefined) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${API_ORIGIN}${url}`;
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Please provide a title or topic for your thumbnail");
            return;
        }

        setError(null);
        setLoading(true);

        const statusIntervals = [
            "Initializing generation pipeline...",
            "Expanding request parameters...",
            "Gemini refining prompt structure...",
            "Gemini composing final layout prompt...",
            "Connecting to image synthesizer...",
            "Synthesizing high CTR elements...",
            "Downloading and saving to local server storage...",
            "Finalizing database record..."
        ];

        let index = 0;
        setStatusText(statusIntervals[0]);
        const statusTimer = setInterval(() => {
            if (index < statusIntervals.length - 1) {
                index++;
                setStatusText(statusIntervals[index]);
            }
        }, 2500);

        try {
            const response = await fetch(`${API_BASE_URL}/thumbnails/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    style,
                    aspect_ratio: aspectRatio,
                    color_scheme: colorScheme,
                    text_overlay: textOverlay,
                    additionalDetails,
                }),
            });

            const data = await response.json();
            clearInterval(statusTimer);

            if (!response.ok) {
                throw new Error(data.message || "Failed to generate thumbnail");
            }

            setThumbnail(data);
            navigate(`/generate/${data._id}`);
        } catch (err: any) {
            clearInterval(statusTimer);
            setError(err.message || "Something went wrong during thumbnail generation");
            console.error(err);
        } finally {
            setLoading(false);
            setStatusText("");
        }
    };

    // Download Handler
    const handleDownload = async () => {
        if (!thumbnail) return;
        try {
            const url = getImageUrl(thumbnail.image_url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-thumbnail.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
            window.open(getImageUrl(thumbnail.image_url), "_blank");
        }
    };

    const handlePreview = () => {
        if (!thumbnail) return;
        navigate("/preview", {
            state: {
                image_url: getImageUrl(thumbnail.image_url),
                title: thumbnail.title,
            },
        });
    };

    return (
        <>
            <SoftBackdrop />
            <div className="pt-24 min-h-screen">
                <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-8 pb-28 lg:pb-8">
                    <div className="grid lg:grid-cols-[420px_1fr] gap-8 mt-6">
                        {/* LEFT PANEL: INPUT CONTROLS */}
                        <div className={`space-y-6 ${id && "pointer-events-none opacity-90"}`}>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl space-y-6 backdrop-blur-sm">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-100 mb-1 flex items-center gap-2">
                                        <Sparkles className="size-5 text-pink-500" /> Create Your Thumbnail
                                    </h2>
                                    <p className="text-xs text-zinc-400">Configure parameters and let Gemini boost your CTR</p>
                                </div>

                                {error && (
                                    <div className="bg-red-500/20 text-red-200 border border-red-500/30 text-xs px-4 py-2.5 rounded-xl">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleGenerate} className="space-y-5">
                                    {/* Video Title */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-300">Video Title / Text Overlay</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Master React in 10 Days"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500/70 transition"
                                            required
                                        />
                                    </div>

                                    {/* Additional Details */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-300">Prompt / Subject Details</label>
                                        <textarea
                                            value={additionalDetails}
                                            onChange={(e) => setAdditionalDetails(e.target.value)}
                                            placeholder="Describe characters, objects, or scenery (e.g. A developer looking amazed at their laptop, neon lighting)"
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500/70 transition resize-none"
                                        />
                                    </div>

                                    {/* Aspect Ratio */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-300">Aspect Ratio</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {aspectRatios.map((ratio) => (
                                                <button
                                                    key={ratio}
                                                    type="button"
                                                    onClick={() => setAspectRatio(ratio)}
                                                    className={`py-2 text-xs font-medium rounded-xl border transition ${
                                                        aspectRatio === ratio
                                                            ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/20"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                                                    }`}
                                                >
                                                    {ratio}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Thumbnail Style */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-300">Design Style</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {thumbnailStyles.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => setStyle(item)}
                                                    className={`py-2.5 px-2 text-[11px] font-medium rounded-xl border transition text-left flex items-center justify-between ${
                                                        style === item
                                                            ? "bg-pink-600 border-pink-500 text-white shadow-md shadow-pink-600/20"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                                                    }`}
                                                >
                                                    <span className="truncate">{item}</span>
                                                    {style === item && <Check className="size-3 shrink-0 ml-1" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Schemes */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-300">Color Palette</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {colorSchemes.map((scheme) => (
                                                <button
                                                    key={scheme.id}
                                                    type="button"
                                                    onClick={() => setColorScheme(scheme.id)}
                                                    className={`p-2.5 rounded-xl border transition text-left flex flex-col gap-1.5 ${
                                                        colorScheme === scheme.id
                                                            ? "bg-pink-600/10 border-pink-500"
                                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                                    }`}
                                                >
                                                    <span className="text-[11px] font-semibold text-zinc-300">{scheme.name}</span>
                                                    <div className="flex gap-1">
                                                        {scheme.colors.map((color, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="size-3.5 rounded-full border border-black/30"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Text Overlay Toggle */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Layers className="size-4 text-pink-400" />
                                            <span className="text-xs font-medium text-zinc-300">Space for Text Overlay</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={textOverlay}
                                                onChange={(e) => setTextOverlay(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                                        </label>
                                    </div>

                                    {/* Generate Trigger */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-pink-600 hover:bg-pink-500 transition text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/35 cursor-pointer disabled:opacity-40"
                                    >
                                        <Sparkles className="size-4" /> Generate with Gemini AI
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT PANEL: PREVIEW / RESULT DISPLAY */}
                        <div className="flex flex-col items-center justify-center">
                            {loading ? (
                                /* Generating Placeholder State */
                                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[400px] text-center backdrop-blur-sm">
                                    <div className="relative size-16 mb-6">
                                        <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 animate-pulse" />
                                        <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-100 mb-2">Creating Masterpiece...</h3>
                                    <p className="text-sm text-zinc-400 max-w-sm animate-pulse">{statusText}</p>
                                </div>
                            ) : thumbnail ? (
                                /* Thumbnail Result Display */
                                <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
                                        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Generated Result</h3>
                                        
                                        {/* Image Display inside Aspect Ratio box */}
                                        <div 
                                            className={`relative mx-auto overflow-hidden rounded-xl border border-white/10 shadow-lg bg-zinc-950 flex items-center justify-center`}
                                            style={{
                                                aspectRatio: aspectRatio === "16:9" ? "16/9" : aspectRatio === "1:1" ? "1/1" : "9/16",
                                                maxHeight: aspectRatio === "9:16" ? "500px" : "auto",
                                                width: aspectRatio === "9:16" ? "281px" : "100%"
                                            }}
                                        >
                                            <img
                                                src={getImageUrl(thumbnail.image_url)}
                                                alt={thumbnail.title}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            onClick={handleDownload}
                                            className="px-6 py-2.5 rounded-full font-bold text-sm bg-pink-600 hover:bg-pink-500 transition text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-pink-600/20"
                                        >
                                            <Download className="size-4" /> Download Thumbnail
                                        </button>
                                        <button
                                            onClick={handlePreview}
                                            className="px-6 py-2.5 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 transition text-zinc-200 border border-white/10 flex items-center gap-2 cursor-pointer"
                                        >
                                            <Eye className="size-4" /> Preview on YouTube
                                        </button>
                                        {id && (
                                            <button
                                                onClick={() => {
                                                    setThumbnail(null);
                                                    setTitle("");
                                                    setAdditionalDetails("");
                                                    navigate("/generate");
                                                }}
                                                className="px-6 py-2.5 rounded-full font-bold text-sm bg-zinc-800 hover:bg-zinc-700 transition text-zinc-300 flex items-center gap-2 cursor-pointer"
                                            >
                                                <RefreshCw className="size-4" /> Create New
                                            </button>
                                        )}
                                    </div>

                                    {/* Generation Info details */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-zinc-400 space-y-2.5 text-left backdrop-blur-sm">
                                        <div>
                                            <span className="font-semibold text-zinc-200 block mb-0.5">Prompt Used by Gemini:</span>
                                            <p className="bg-black/30 p-2.5 rounded-lg border border-white/5 text-zinc-300 italic select-all">{thumbnail.prompt_used}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-white/5">
                                            <div>
                                                <span className="font-semibold text-zinc-200 block">Style Selected:</span>
                                                <span>{thumbnail.style}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-zinc-200 block">Color Palette:</span>
                                                <span className="capitalize">{thumbnail.color_scheme}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Idle state placeholder */
                                <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[400px] text-center backdrop-blur-sm">
                                    <div className="size-16 rounded-full bg-pink-600/10 border border-pink-500/20 flex items-center justify-center mb-6">
                                        <Sparkles className="size-6 text-pink-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-100 mb-2">Visual Generation Canvas</h3>
                                    <p className="text-sm text-zinc-400 max-w-sm">
                                        Your custom generated high CTR thumbnail will render here. Configure parameters in the left panel to begin.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Generate;