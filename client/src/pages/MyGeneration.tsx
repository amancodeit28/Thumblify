import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Trash2, Sparkles, AlertCircle } from "lucide-react";
import SoftBackdrop from "../components/SoftBackdrop";
import { useAuth, API_BASE_URL, API_ORIGIN } from "../context/AuthContext";
import type { IThumbnail } from "../assets/assets";

const MyGeneration = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if no token
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Fetch user generations
    useEffect(() => {
        const fetchGenerations = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/thumbnails/my-generations`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setThumbnails(data);
                } else {
                    throw new Error("Failed to load generations");
                }
            } catch (err: any) {
                setError(err.message || "Something went wrong while fetching generations");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGenerations();
    }, [token]);

    // Resolve Backend URLs
    const getImageUrl = (url: string | undefined) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${API_ORIGIN}${url}`;
    };

    // Download Handler
    const handleDownload = async (thumbnail: IThumbnail) => {
        try {
            const url = getImageUrl(thumbnail.image_url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${thumbnail.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-thumbnail.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
            window.open(getImageUrl(thumbnail.image_url), "_blank");
        }
    };

    // Delete Handler
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this generation? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/thumbnails/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Filter out the deleted thumbnail
                setThumbnails(prev => prev.filter(t => t._id !== id));
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete thumbnail");
            }
        } catch (err: any) {
            alert(err.message || "Could not delete thumbnail");
            console.error(err);
        }
    };

    const handlePreview = (thumbnail: IThumbnail) => {
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                                <Sparkles className="size-6 text-pink-500" /> My Generations
                            </h1>
                            <p className="text-zinc-400 text-sm mt-1">Review, preview, and download your past AI-generated thumbnails</p>
                        </div>
                        <button
                            onClick={() => navigate("/generate")}
                            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold text-sm transition shadow-lg shadow-pink-600/20 active:scale-95 self-start md:self-auto"
                        >
                            Generate New
                        </button>
                    </div>

                    {loading ? (
                        /* Loading State Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse space-y-4">
                                    <div className="aspect-video bg-white/5 rounded-xl w-full" />
                                    <div className="h-4 bg-white/5 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        /* Error State */
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12">
                            <AlertCircle className="size-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-bold text-zinc-100 mb-2">Failed to Load Content</h3>
                            <p className="text-sm text-zinc-400 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-full text-xs font-semibold hover:bg-zinc-700 transition"
                            >
                                Retry
                            </button>
                        </div>
                    ) : thumbnails.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12 backdrop-blur-sm shadow-xl">
                            <div className="size-16 rounded-full bg-pink-600/10 border border-pink-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="size-6 text-pink-500" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-100 mb-2">No Generations Found</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                You haven't generated any AI thumbnails yet. Get started now and create high CTR assets!
                            </p>
                            <button
                                onClick={() => navigate("/generate")}
                                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold text-sm transition"
                            >
                                Generate First Thumbnail
                            </button>
                        </div>
                    ) : (
                        /* Active Gallery Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {thumbnails.map((thumb) => {
                                const isPortrait = thumb.aspect_ratio === "9:16";
                                const isSquare = thumb.aspect_ratio === "1:1";
                                return (
                                    <div
                                        key={thumb._id}
                                        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-900/5 transition duration-300 flex flex-col backdrop-blur-sm"
                                    >
                                        {/* Image wrapper */}
                                        <div 
                                            className="relative bg-zinc-950 w-full overflow-hidden flex items-center justify-center border-b border-white/10"
                                            style={{
                                                aspectRatio: isPortrait ? "9/16" : isSquare ? "1/1" : "16/9",
                                                maxHeight: isPortrait ? "400px" : "auto",
                                            }}
                                        >
                                            <img
                                                src={getImageUrl(thumb.image_url)}
                                                alt={thumb.title}
                                                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                            />

                                            {/* Hover Action Overlays */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleDownload(thumb)}
                                                    title="Download Image"
                                                    className="size-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-500 transition active:scale-90 cursor-pointer shadow-lg shadow-pink-600/30"
                                                >
                                                    <Download className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePreview(thumb)}
                                                    title="YouTube Preview Simulator"
                                                    className="size-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition active:scale-90 border border-white/20 cursor-pointer"
                                                >
                                                    <Eye className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(thumb._id)}
                                                    title="Delete Generation"
                                                    className="size-10 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition active:scale-90 cursor-pointer"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Meta content details */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-zinc-100 text-sm line-clamp-1 group-hover:text-pink-400 transition">
                                                    {thumb.title}
                                                </h3>
                                                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                                                    {thumb.user_prompt || "No prompt details provided"}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[10px] text-zinc-500">
                                                <span className="capitalize">{thumb.style}</span>
                                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-medium">{thumb.aspect_ratio || "16:9"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default MyGeneration;