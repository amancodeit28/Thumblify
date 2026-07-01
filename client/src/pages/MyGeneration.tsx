import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Trash2, Sparkles, AlertCircle, FolderPlus, Folder, FolderOpen, Search, ArrowUpDown, ChevronRight, X } from "lucide-react";
import SoftBackdrop from "../components/SoftBackdrop";
import { useAuth, API_BASE_URL, API_ORIGIN } from "../context/AuthContext";
import type { IThumbnail } from "../assets/assets";

interface IFolder {
    _id: string;
    name: string;
    userId: string;
}

const MyGeneration = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    // Data States
    const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
    const [folders, setFolders] = useState<IFolder[]>([]);
    
    // UI Filters & Queries
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All, "unorganized" = Unorganized
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "title-az" | "title-za"

    // Loaders & Errors
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add Folder Dialog State
    const [showAddFolder, setShowAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Redirect to login if no token
    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Fetch Folders & Generations
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch Folders
            const foldersResponse = await fetch(`${API_BASE_URL}/folders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const foldersData = await foldersResponse.json();
            if (foldersResponse.ok) {
                setFolders(foldersData);
            }

            // Fetch Generations
            let url = `${API_BASE_URL}/thumbnails/my-generations`;
            if (selectedFolderId) {
                url += `?folderId=${selectedFolderId}`;
            }

            const thumbnailsResponse = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const thumbnailsData = await thumbnailsResponse.json();
            if (thumbnailsResponse.ok) {
                setThumbnails(thumbnailsData);
            } else {
                throw new Error(thumbnailsData.message || "Failed to load generations");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong while fetching data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token, selectedFolderId]);

    // Helper to resolve backend image URL
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

    // Delete Thumbnail Handler
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this generation? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/thumbnails/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
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

    // Move Thumbnail to Folder Handler
    const handleMoveThumbnail = async (id: string, folderId: string | null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/thumbnails/${id}/move`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ folderId }),
            });

            if (response.ok) {
                // Refresh list to respect current folder filter
                fetchData();
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to move thumbnail");
            }
        } catch (err: any) {
            alert(err.message || "Could not move thumbnail");
            console.error(err);
        }
    };

    // Create Folder Handler
    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const response = await fetch(`${API_BASE_URL}/folders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newFolderName.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setFolders(prev => [...prev, data]);
                setNewFolderName("");
                setShowAddFolder(false);
            } else {
                throw new Error(data.message || "Failed to create folder");
            }
        } catch (err: any) {
            alert(err.message || "Could not create folder");
        }
    };

    // Delete Folder Handler
    const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid triggering folder click selection
        if (!window.confirm("Are you sure you want to delete this folder? The thumbnails inside will return to 'Unorganized' view.")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setFolders(prev => prev.filter(f => f._id !== folderId));
                if (selectedFolderId === folderId) {
                    setSelectedFolderId(null);
                } else {
                    fetchData();
                }
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete folder");
            }
        } catch (err: any) {
            alert(err.message || "Could not delete folder");
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

    // Process searches and sorts on frontend
    const filteredThumbnails = thumbnails
        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (t.user_prompt && t.user_prompt.toLowerCase().includes(searchQuery.toLowerCase())))
        .sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
            }
            if (sortBy === "oldest") {
                return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
            }
            if (sortBy === "title-az") {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === "title-za") {
                return b.title.localeCompare(a.title);
            }
            return 0;
        });

    return (
        <>
            <SoftBackdrop />
            <div className="pt-24 min-h-screen">
                <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-8 pb-28 lg:pb-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
                                <Sparkles className="size-6 text-pink-500" /> File Workspace
                            </h1>
                            <p className="text-zinc-400 text-sm mt-1">Organize your YouTube channels and thumbnails in folders</p>
                        </div>
                        <button
                            onClick={() => navigate("/generate")}
                            className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold text-sm transition shadow-lg shadow-pink-600/20 active:scale-95 self-start md:self-auto"
                        >
                            Generate New
                        </button>
                    </div>

                    {/* File Manager Grid */}
                    <div className="grid lg:grid-cols-[260px_1fr] gap-8 mt-6">
                        
                        {/* LEFT SIDEBAR: FOLDERS MANAGEMENT */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl space-y-4 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">My Collections</h2>
                                    <button 
                                        onClick={() => setShowAddFolder(true)}
                                        title="Create Folder"
                                        className="text-pink-400 hover:text-pink-300 transition cursor-pointer"
                                    >
                                        <FolderPlus className="size-5" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {/* All Assets Tab */}
                                    <button
                                        onClick={() => setSelectedFolderId(null)}
                                        className={`w-full px-3 py-2 text-xs font-medium rounded-xl text-left flex items-center gap-2.5 transition ${
                                            selectedFolderId === null
                                                ? "bg-pink-600 text-white"
                                                : "text-zinc-300 hover:bg-white/5"
                                        }`}
                                    >
                                        {selectedFolderId === null ? <FolderOpen className="size-4" /> : <Folder className="size-4" />}
                                        <span className="truncate">All Assets</span>
                                    </button>

                                    {/* Unorganized Tab */}
                                    <button
                                        onClick={() => setSelectedFolderId("unorganized")}
                                        className={`w-full px-3 py-2 text-xs font-medium rounded-xl text-left flex items-center gap-2.5 transition ${
                                            selectedFolderId === "unorganized"
                                                ? "bg-pink-600 text-white"
                                                : "text-zinc-300 hover:bg-white/5"
                                        }`}
                                    >
                                        {selectedFolderId === "unorganized" ? <FolderOpen className="size-4" /> : <Folder className="size-4" />}
                                        <span className="truncate">Unorganized</span>
                                    </button>

                                    <hr className="border-white/5 my-2" />

                                    {/* Dynamic Folder List */}
                                    {folders.map(folder => (
                                        <button
                                            key={folder._id}
                                            onClick={() => setSelectedFolderId(folder._id)}
                                            className={`w-full px-3 py-2.5 text-xs font-medium rounded-xl text-left flex items-center justify-between group transition ${
                                                selectedFolderId === folder._id
                                                    ? "bg-pink-600 text-white"
                                                    : "text-zinc-300 hover:bg-white/5"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {selectedFolderId === folder._id ? <FolderOpen className="size-4 text-white shrink-0" /> : <Folder className="size-4 text-pink-500/80 shrink-0" />}
                                                <span className="truncate">{folder.name}</span>
                                            </div>
                                            <Trash2
                                                onClick={(e) => handleDeleteFolder(folder._id, e)}
                                                className={`size-3.5 hover:text-red-400 cursor-pointer text-zinc-400 opacity-0 group-hover:opacity-100 transition`}
                                            />
                                        </button>
                                    ))}

                                    {folders.length === 0 && (
                                        <p className="text-[10px] text-zinc-500 italic text-center py-4">No folders created yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT CONTENT: GALLERY WORKSPACE */}
                        <div className="space-y-6">
                            
                            {/* Search and Sort Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                {/* Search bar */}
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search titles or prompts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                                    />
                                </div>

                                {/* Sort Control */}
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <ArrowUpDown className="size-3.5 text-zinc-400" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 cursor-pointer"
                                    >
                                        <option value="newest" className="bg-[#121214]">Newest First</option>
                                        <option value="oldest" className="bg-[#121214]">Oldest First</option>
                                        <option value="title-az" className="bg-[#121214]">Title (A - Z)</option>
                                        <option value="title-za" className="bg-[#121214]">Title (Z - A)</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                /* Loading Gallery Skeleton */
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse space-y-4">
                                            <div className="aspect-video bg-white/5 rounded-xl w-full" />
                                            <div className="h-4 bg-white/5 rounded w-3/4" />
                                            <div className="h-3 bg-white/5 rounded w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                    <AlertCircle className="size-10 text-red-500 mb-2" />
                                    <p className="text-sm text-zinc-300">{error}</p>
                                </div>
                            ) : filteredThumbnails.length === 0 ? (
                                /* Empty State */
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center max-w-lg mx-auto backdrop-blur-sm">
                                    <Folder className="size-12 text-pink-500/30 mb-4 animate-pulse" />
                                    <h3 className="text-lg font-bold text-zinc-100 mb-1">No Assets Found</h3>
                                    <p className="text-xs text-zinc-400 max-w-xs">
                                        No thumbnails match your search query or folder filter. Create one to populate your canvas!
                                    </p>
                                </div>
                            ) : (
                                /* Active Cards Grid */
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredThumbnails.map(thumb => {
                                        const isPortrait = thumb.aspect_ratio === "9:16";
                                        const isSquare = thumb.aspect_ratio === "1:1";
                                        return (
                                            <div
                                                key={thumb._id}
                                                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-900/5 transition duration-300 flex flex-col justify-between backdrop-blur-sm"
                                            >
                                                {/* Image Container with Actions overlay */}
                                                <div 
                                                    className="relative bg-zinc-950 w-full overflow-hidden flex items-center justify-center border-b border-white/10"
                                                    style={{
                                                        aspectRatio: isPortrait ? "9/16" : isSquare ? "1/1" : "16/9",
                                                        maxHeight: isPortrait ? "380px" : "auto",
                                                    }}
                                                >
                                                    <img
                                                        src={getImageUrl(thumb.image_url)}
                                                        alt={thumb.title}
                                                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                                    />

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                        <button
                                                            onClick={() => handleDownload(thumb)}
                                                            className="size-9 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-500 transition cursor-pointer shadow-lg shadow-pink-600/30 active:scale-90"
                                                            title="Download File"
                                                        >
                                                            <Download className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePreview(thumb)}
                                                            className="size-9 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer border border-white/20 active:scale-90"
                                                            title="YouTube Preview"
                                                        >
                                                            <Eye className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(thumb._id)}
                                                            className="size-9 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition cursor-pointer active:scale-90"
                                                            title="Delete File"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Meta Info */}
                                                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-zinc-100 text-sm line-clamp-1 group-hover:text-pink-400 transition">
                                                            {thumb.title}
                                                        </h3>
                                                        <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                                                            {thumb.user_prompt || "No additional requirements"}
                                                        </p>
                                                    </div>

                                                    {/* Move to Folder Selection */}
                                                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                                                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                                            <span className="capitalize">{thumb.style}</span>
                                                            <span>{thumb.aspect_ratio || "16:9"}</span>
                                                        </div>
                                                        
                                                        {/* Folder Move Dropdown selector */}
                                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                                                            <Folder className="size-3.5 text-zinc-400 shrink-0" />
                                                            <select
                                                                value={thumb.folderId || ""}
                                                                onChange={(e) => handleMoveThumbnail(thumb._id, e.target.value || null)}
                                                                className="w-full bg-transparent text-[10px] text-zinc-300 border-none outline-none cursor-pointer focus:ring-0"
                                                            >
                                                                <option value="" className="bg-[#121214] text-zinc-400">Unorganized</option>
                                                                {folders.map(f => (
                                                                    <option key={f._id} value={f._id} className="bg-[#121214] text-zinc-200">
                                                                        Move: {f.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* ADD FOLDER DIALOG POPUP */}
            <AnimatePresence>
                {showAddFolder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setShowAddFolder(false)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>

                            <form onSubmit={handleCreateFolder} className="space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                                        <FolderPlus className="size-5 text-pink-500" /> Create Workspace Folder
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">Group assets by channel, project, or topic</p>
                                </div>

                                <input
                                    type="text"
                                    placeholder="e.g. My Coding Channel"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    maxLength={30}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                                    required
                                    autoFocus
                                />

                                <div className="flex justify-end gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddFolder(false)}
                                        className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer bg-white/5 hover:bg-white/10 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 transition rounded-xl cursor-pointer"
                                    >
                                        Create Folder
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MyGeneration;