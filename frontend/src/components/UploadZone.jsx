import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import VideoTrimmer from './VideoTrimmer';

const UploadZone = ({ onUpload, isUploading, shotType, setShotType }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isTrimming, setIsTrimming] = useState(false);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
            setIsTrimming(true);
        }
    }, []);

    const handleTrimConfirm = (start, end) => {
        setIsTrimming(false);
        // Pass file and trim data to parent
        onUpload(selectedFile, start, end);
        setSelectedFile(null);
    };

    const handleTrimCancel = () => {
        setSelectedFile(null);
        setIsTrimming(false);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'video/*': ['.mp4', '.mov', '.avi']
        },
        multiple: false,
        disabled: isUploading || isTrimming
    });

    if (isTrimming && selectedFile) {
        return (
            <VideoTrimmer
                file={selectedFile}
                onTrimConfirm={handleTrimConfirm}
                onCancel={handleTrimCancel}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            {/* Shot Selector */}
            <div className="flex justify-center">
                <div className="relative">
                    <select
                        value={shotType}
                        onChange={(e) => setShotType(e.target.value)}
                        disabled={isUploading}
                        className="appearance-none bg-white/10 border border-white/20 rounded-full px-6 py-3 pr-12 text-white font-medium focus:outline-none focus:border-primary transition-colors cursor-pointer hover:bg-white/20 w-full md:w-auto text-center"
                    >
                        <optgroup label="Serves & Smashes" className="bg-gray-800 text-gray-300">
                            <option value="serve">Serve</option>
                            <option value="jump smash">Jump Smash</option>
                            <option value="kick smash">Kick Smash</option>
                            <option value="slice smash">Slice Smash</option>
                            <option value="hook">Hook</option>
                        </optgroup>

                        <optgroup label="Volleys" className="bg-gray-800 text-gray-300">
                            <option value="forehand volley">Forehand Volley</option>
                            <option value="backhand volley">Backhand Volley</option>
                        </optgroup>

                        <optgroup label="Dropshots" className="bg-gray-800 text-gray-300">
                            <option value="high forehand dropshot">High Forehand Dropshot</option>
                            <option value="high backhand dropshot">High Backhand Dropshot</option>
                            <option value="low forehand dropshot">Low Forehand Dropshot</option>
                            <option value="low backhand dropshot">Low Backhand Dropshot</option>
                        </optgroup>

                        <optgroup label="Lobs" className="bg-gray-800 text-gray-300">
                            <option value="high forehand lob">High Forehand Lob</option>
                            <option value="high backhand lob">High Backhand Lob</option>
                            <option value="low forehand lob">Low Forehand Lob</option>
                            <option value="low backhand lob">Low Backhand Lob</option>
                        </optgroup>

                        <optgroup label="Blocks" className="bg-gray-800 text-gray-300">
                            <option value="forehand block">Forehand Block</option>
                            <option value="backhand block">Backhand Block</option>
                        </optgroup>

                        <optgroup label="Pushes" className="bg-gray-800 text-gray-300">
                            <option value="slice push">Slice Push</option>
                            <option value="kick push">Kick Push</option>
                            <option value="flat push">Flat Push</option>
                        </optgroup>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div
                {...getRootProps()}
                className={`
          glass-panel p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-primary bg-white/10' : 'hover:border-white/30'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-white/5">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        ) : (
                            <Upload className="w-12 h-12 text-gray-300" />
                        )}
                    </div>

                    <h3 className="text-xl font-semibold">
                        {isUploading ? `Analyzing ${shotType.charAt(0).toUpperCase() + shotType.slice(1)}...` : 'Upload Video'}
                    </h3>

                    <p className="text-gray-400">
                        {isDragActive ?
                            "Drop the video here..." :
                            "Drag & drop your sports video, or click to select"
                        }
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                        <FileVideo className="w-4 h-4" />
                        <span>MP4, MOV, AVI supported</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UploadZone;
