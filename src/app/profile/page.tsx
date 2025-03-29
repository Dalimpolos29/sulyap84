'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useProfileContext, ProfileProvider } from '@/contexts/ProfileContext'
import Link from 'next/link'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import ImageCropper from '@/components/ImageCropper'
import FeaturedPhotos from '@/components/FeaturedPhotos'
import { FaIdCard, FaBriefcase, FaPhone, FaChildren } from "react-icons/fa6";
import { FaBirthdayCake } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";
import { GiBigDiamondRing } from "react-icons/gi";

// Function to format date strings for display
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not provided'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

// Hobby categories and their keywords for classification
const HOBBY_CATEGORIES: Record<string, { color: string, keywords: string[] }> = {
  sports: {
    color: 'bg-orange-500',
    keywords: ['sport', 'ball', 'running', 'swim', 'tennis', 'soccer', 'basketball', 'football', 'volleyball', 'baseball', 'golf', 'cycling', 'gym', 'fitness', 'workout', 'boxing', 'martial']
  },
  arts: {
    color: 'bg-purple-500',
    keywords: ['art', 'paint', 'draw', 'craft', 'sketch', 'photography', 'design', 'pottery', 'sculpture', 'creative', 'writing', 'knitting']
  },
  music: {
    color: 'bg-amber-700',
    keywords: ['music', 'guitar', 'piano', 'sing', 'drum', 'bass', 'violin', 'instrument', 'band', 'concert', 'compose', 'dj']
  },
  outdoor: {
    color: 'bg-green-600',
    keywords: ['hike', 'camp', 'nature', 'fish', 'hunt', 'garden', 'outdoor', 'climbing', 'mountain', 'beach', 'surf']
  },
  technology: {
    color: 'bg-blue-600',
    keywords: ['tech', 'code', 'program', 'computer', 'game', 'gaming', 'robot', 'software', 'hardware', 'develop']
  },
  reading: {
    color: 'bg-indigo-600',
    keywords: ['read', 'book', 'literature', 'novel', 'poetry', 'writing', 'blog']
  },
  culinary: {
    color: 'bg-red-500',
    keywords: ['cook', 'bake', 'food', 'culinary', 'recipe', 'wine', 'coffee', 'beer', 'taste', 'kitchen']
  },
  collecting: {
    color: 'bg-yellow-600',
    keywords: ['collect', 'stamp', 'coin', 'figure', 'model', 'antique', 'vintage']
  },
  entertainment: {
    color: 'bg-pink-500',
    keywords: ['movie', 'film', 'tv', 'show', 'theater', 'cinema', 'series', 'streaming', 'actor', 'actress']
  },
  wellness: {
    color: 'bg-teal-500',
    keywords: ['yoga', 'meditate', 'meditation', 'wellness', 'mindful', 'health', 'spiritual', 'relax']
  },
  travel: {
    color: 'bg-cyan-600',
    keywords: ['travel', 'adventure', 'explore', 'trip', 'journey', 'backpack', 'tourist', 'vacation']
  },
  other: {
    color: 'bg-gray-500',
    keywords: []
  }
};

// Common hobbies for suggestions
const COMMON_HOBBIES = [
  'Reading', 'Running', 'Swimming', 'Cooking', 'Baking', 'Painting', 
  'Photography', 'Hiking', 'Gardening', 'Yoga', 'Meditation', 'Cycling', 
  'Playing Guitar', 'Piano', 'Singing', 'Dancing', 'Writing', 'Traveling', 
  'Fishing', 'Camping', 'Basketball', 'Soccer', 'Tennis', 'Golf', 
  'Video Games', 'Programming', 'Chess', 'Puzzles', 'Watching Movies', 
  'Collecting Stamps', 'Knitting', 'Sewing', 'Woodworking'
];

// Helper function to determine hobby category
const getHobbyCategory = (hobby: string): string => {
  const hobbyLower = hobby.toLowerCase();
  
  for (const [category, data] of Object.entries(HOBBY_CATEGORIES)) {
    if (category === 'other') continue; // Skip the default category
    if (data.keywords.some(keyword => hobbyLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'other'; // Default category
};

// Profile content component
function ProfileContent() {
  const router = useRouter()
  const { profile, loading, error, fullName, displayName, nameWithMiddleInitial, initials, refetchProfile } = useProfileContext()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    profession: '',
    email: '',
    phone_number: '',
    spouse_name: '',
    children: '',
    hobbies_interests: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Hobby management
  const [currentHobby, setCurrentHobby] = useState('')
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  // Memoized filtered suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!currentHobby.trim()) return [];
    const input = currentHobby.toLowerCase().trim();
    return COMMON_HOBBIES
      .filter(hobby => hobby.toLowerCase().includes(input) && 
              !selectedHobbies.includes(hobby))
      .slice(0, 5); // Limit to 5 suggestions
  }, [currentHobby, selectedHobbies]);
  
  // Parse hobbies from string or array
  const parseHobbies = (hobbiesValue: string[] | string | null): string[] => {
    if (!hobbiesValue) return [];
    
    // If it's already an array, just clean it
    if (Array.isArray(hobbiesValue)) {
      return hobbiesValue.map(h => h.trim()).filter(h => h !== '');
    }
    
    // If it's a string, split by semicolons
    return hobbiesValue.split(';')
      .map(h => h.trim())
      .filter(h => h !== '');
  };
  
  // Format hobbies to string or array based on database needs
  const formatHobbies = (hobbies: string[]): string[] => {
    if (!hobbies || !Array.isArray(hobbies) || hobbies.length === 0) return [];
    return hobbies.map(h => h.trim()).filter(h => h !== '');
  };
  
  // Add a hobby to the selected list
  const addHobby = (hobby: string) => {
    const trimmedHobby = hobby.trim();
    if (!trimmedHobby || selectedHobbies.includes(trimmedHobby)) return;
    
    setSelectedHobbies(prev => [...prev, trimmedHobby]);
    setCurrentHobby('');
  };
  
  // Remove a hobby from the selected list
  const removeHobby = (hobby: string) => {
    setSelectedHobbies(prev => prev.filter(h => h !== hobby));
  };
  
  // Handle hobby input changes
  const handleHobbyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentHobby(e.target.value);
    setShowSuggestions(true);
  };
  
  // Handle hobby input keydown for adding with Enter
  const handleHobbyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentHobby.trim()) {
      e.preventDefault();
      
      // If there's a matching suggestion, use it
      const matchingSuggestion = filteredSuggestions[0];
      if (matchingSuggestion && matchingSuggestion.toLowerCase().startsWith(currentHobby.toLowerCase())) {
        addHobby(matchingSuggestion);
      } else {
        // Otherwise use the exact text typed
        addHobby(currentHobby);
      }
    }
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update editData when profile changes
  useEffect(() => {
    if (profile) {
      setEditData({
        profession: profile.profession || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        spouse_name: profile.spouse_name || '',
        children: profile.children || '',
        hobbies_interests: profile.hobbies_interests || ''
      });
      
      // Parse hobbies from the hobbies_interests field
      setSelectedHobbies(parseHobbies(profile.hobbies_interests));
    }
  }, [profile]);
  
  // Check if this is the user's own profile
  useEffect(() => {
    const checkProfileOwnership = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && profile && session.user.id === profile.id) {
        setIsOwnProfile(true)
      }
    }
    
    checkProfileOwnership()
  }, [profile, supabase.auth])
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle save profile
  const handleSaveProfile = async () => {
    if (!profile) return
    
    try {
      setIsSaving(true)
      
      const formattedHobbies = formatHobbies(selectedHobbies);
      console.log('Formatted hobbies (inspect type):', formattedHobbies, 'Type:', typeof formattedHobbies, 'Is array:', Array.isArray(formattedHobbies));
      
      const updatedData = {
        profession: editData.profession,
        email: editData.email,
        phone_number: editData.phone_number,
        spouse_name: editData.spouse_name,
        children: editData.children,
        hobbies_interests: formattedHobbies
      };
      
      console.log('Saving profile data:', updatedData);
      
      // First try getting the profile to make sure it exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, hobbies_interests')
        .eq('id', profile.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching profile before update:', fetchError);
        throw new Error(fetchError.message || 'Could not verify profile exists');
      }
      
      console.log('Current hobbies in database:', existingProfile?.hobbies_interests, 
                 'Type:', typeof existingProfile?.hobbies_interests, 
                 'Is array:', Array.isArray(existingProfile?.hobbies_interests));
      
      if (!existingProfile) {
        throw new Error('Profile not found');
      }
      
      // Then update the profile
      const { data, error: updateError, status } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', profile.id)
        .select();
      
      if (updateError) {
        console.error('Error updating profile (detailed):', JSON.stringify(updateError));
        throw new Error(updateError.message || 'Unknown error updating profile');
      }
      
      if (status >= 400) {
        throw new Error(`Error: Status ${status}`);
      }
      
      console.log('Profile updated successfully:', data);
      
      // Refresh the profile data
      await refetchProfile();
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile - complete error:', error);
      console.error('Error object stringified:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to save profile changes';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (error && typeof error === 'object') {
        errorMessage += `: ${JSON.stringify(error)}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }
  
  // Cancel editing
  const handleCancelEdit = () => {
    if (profile) {
      setEditData({
        profession: profile.profession || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        spouse_name: profile.spouse_name || '',
        children: profile.children || '',
        hobbies_interests: profile.hobbies_interests || ''
      })
    }
    setIsEditing(false)
  }
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    
    // Create a preview for the cropper
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }
  
  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    if (!profile) return
    
    try {
      setUploadingPhoto(true)
      
      // Create user folder name - use fullName or fallback to user ID if no name available
      const userFolderName = fullName.replace(/\s+/g, '_') || profile.id
      
      // Create a unique file name
      const fileName = `${Date.now()}.jpeg`
      
      // Use user-specific folder structure
      const filePath = `${userFolderName}/profile/${fileName}`
      
      console.log("Uploading to:", filePath)
      
      // Upload the file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, croppedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })
      
      if (uploadError) {
        console.error("Upload error details:", uploadError)
        throw uploadError
      }
      
      console.log("Upload successful:", data)
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)
      
      console.log("Public URL:", publicUrl)
      
      // Update the profile with the new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', profile.id)
      
      if (updateError) {
        console.error("Profile update error:", updateError)
        throw updateError
      }
      
      // Refresh the profile data
      await refetchProfile()
      
      // Clear the selected image
      setSelectedImage(null)
      
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
      // Clear the file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  
  // Cancel cropping
  const handleCancelCrop = () => {
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  // Trigger file selection dialog
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C9A335]"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 border border-red-500 text-red-400 px-4 py-3 rounded-md">
          <p>Error loading profile: {error}</p>
          <button 
            className="mt-2 text-sm text-red-400 hover:underline"
            onClick={() => router.push('/')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-md">
          <p>Profile not found. Please complete your profile setup.</p>
          <button 
            className="mt-2 text-sm text-yellow-400 hover:underline"
            onClick={() => router.push('/')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-[#1E1E1E] text-white">
      {/* Header - Keep existing header */}
      <header className="bg-[#7D1A1D] text-white py-3 shadow-md sticky top-0 z-50">
        <div className="w-full max-w-[1400px] mx-auto flex justify-between items-center px-4 sm:px-6 md:px-8">
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-[#C9A335] shadow-md">
                <Image
                  src="/images/logo.svg"
                  alt="UPIS 84 Logo"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <span className="font-serif font-bold text-base md:text-lg line-clamp-1">UPIS Alumni Portal</span>
            </Link>
          </div>
          
          {/* Back to Dashboard Button */}
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white bg-[#7D1A1D]/80 hover:bg-[#7D1A1D]/90 py-2 px-4 rounded-md transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 md:px-8 max-w-[1400px] mx-auto w-full">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
            </div>
            
        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Profile Card */}
          <div className="bg-[#242424] rounded-xl p-6 pb-3 sm:pb-6 flex flex-col items-center md:min-h-[30rem] col-span-12 md:col-span-5">
            <h2 className="text-3xl font-bold text-center mb-1">{displayName}</h2>
            <div className="text-[#C9A335] text-sm font-medium mb-3">Alumni</div>
            
            <div className="relative w-full max-w-[98%] md:max-w-[90%] lg:max-w-[98%] mx-auto flex-1 flex items-center">
                  {profile.profile_picture_url ? (
                <div className="aspect-square w-full relative">
                  {/* Outer circle frame with gold color */}
                  <div className="absolute inset-0 rounded-full bg-[#C9A335] z-0"></div>
                  
                  {/* Image with shadow on top */}
                  <div className="absolute inset-[22px] rounded-full overflow-hidden z-10 shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
                      <Image
                        src={profile.profile_picture_url}
                        alt={`${fullName}'s profile picture`}
                      fill
                      className="object-cover"
                        priority
                      />
                  </div>
                  
                  {/* Camera icon positioned to always be at the same position relative to the circle border */}
                      {isOwnProfile && (
                    <div className="absolute z-30" style={{ right: '8%', bottom: '11%', transform: 'translate(0%, 0%)' }}>
                        <button 
                          onClick={handleUploadClick}
                        className="bg-[#242424] rounded-full p-2 shadow-lg"
                          aria-label="Change profile picture"
                        >
                        <Camera size={20} className="text-[#C9A335]" />
                        </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square w-full relative">
                  {/* Outer circle frame with gold color */}
                  <div className="absolute inset-0 rounded-full bg-[#C9A335] z-0"></div>
                  
                  {/* Initials with shadow on top */}
                  <div className="absolute inset-[22px] rounded-full overflow-hidden z-10 shadow-[0_8px_24px_rgba(0,0,0,0.7)] bg-gray-600 flex items-center justify-center">
                    <span className="text-7xl font-bold">{initials}</span>
                      </div>
                  
                  {/* Camera icon positioned to always be at the same position relative to the circle border */}
                      {isOwnProfile && (
                    <div className="absolute z-30" style={{ right: '8%', bottom: '11%', transform: 'translate(0%, 0%)' }}>
                        <button 
                          onClick={handleUploadClick}
                        className="bg-[#242424] rounded-full p-2 shadow-lg"
                          aria-label="Add profile picture"
                        >
                        <Camera size={20} className="text-[#C9A335]" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Bio & Details Card */}
          <div className="bg-[#242424] rounded-xl p-6 col-span-12 md:col-span-7">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
              {isOwnProfile ? "Personal Information" : "User Information"}
              {isOwnProfile && (
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[#C9A335] hover:text-[#E5BD4F] transition-colors"
                  aria-label={isEditing ? "Cancel editing" : "Edit information"}
                  disabled={isSaving}
                >
                  {isEditing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  )}
                </button>
              )}
            </h2>
            
            {isEditing ? (
              /* Edit Mode - Same layout as view mode */
              <div className="space-y-5">
                <div className="p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Row 1: Full Name | Birthday */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Full name</p>
                      <div className="flex items-center">
                        <FaIdCard className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{nameWithMiddleInitial}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Birthday</p>
                      <div className="flex items-center">
                        <FaBirthdayCake className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{formatDate(profile.birthday)}</p>
                      </div>
                    </div>
                    
                    {/* Row 2: Profession (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Profession</p>
                      <div className="flex items-center">
                        <FaBriefcase className="h-5 w-5 text-[#C9A335] mr-3" />
                        {isEditing ? (
                          <input
                            type="text"
                            name="profession"
                            value={editData.profession || ''}
                            onChange={handleInputChange}
                            className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                            placeholder="Your profession"
                          />
                        ) : (
                          <p className="font-medium break-words">{profile.profession || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                  
                    {/* Row 3: Phone | Email */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Phone</p>
                      <div className="flex items-center">
                        <FaPhone className="h-5 w-5 text-[#C9A335] mr-3" />
                        {isEditing ? (
                          <input
                            type="tel"
                            name="phone_number"
                            value={editData.phone_number || ''}
                            onChange={handleInputChange}
                            className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                            placeholder="Your phone number"
                          />
                        ) : (
                          <p className="font-medium break-words">{profile.phone_number || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Email</p>
                      <div className="flex items-start">
                        <IoIosMail className="h-5 w-5 text-[#C9A335] mr-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={editData.email || ''}
                              onChange={handleInputChange}
                              className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                              placeholder="Your email address"
                            />
                          ) : (
                            <p className="font-medium break-all text-sm sm:text-base">{profile.email || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 4: Address (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Address</p>
                      <div className="flex items-center text-gray-500 italic">
                        <p>Coming soon</p>
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                    
                    {/* Row 5: Spouse | Children */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Spouse</p>
                      <div className="flex items-center">
                        <GiBigDiamondRing className="h-5 w-5 text-[#C9A335] mr-3" />
                        {isEditing ? (
                          <input
                            type="text"
                            name="spouse_name"
                            value={editData.spouse_name || ''}
                            onChange={handleInputChange}
                            className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                            placeholder="Spouse's name"
                          />
                        ) : (
                          <p className="font-medium break-words">{profile.spouse_name || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Children</p>
                      <div className="flex items-center">
                        <FaChildren className="h-5 w-5 text-[#C9A335] mr-3" />
                        {isEditing ? (
                          <input
                            type="text"
                            name="children"
                            value={editData.children || ''}
                            onChange={handleInputChange}
                            className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                            placeholder="Children's names"
                          />
                        ) : (
                          <p className="font-medium break-words">{profile.children || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                  
                    {/* Row 6: Hobbies & Interests (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Hobbies & interests</p>
                      <div className="pl-8">
                        {isEditing ? (
                          <div className="w-full">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {selectedHobbies.map((hobby) => {
                                const category = getHobbyCategory(hobby);
                                return (
                                  <span 
                                    key={hobby}
                                    className={`${HOBBY_CATEGORIES[category].color} text-white text-xs px-2 py-0.5 rounded-full flex items-center`}
                                  >
                                    {hobby}
                                    <button 
                                      onClick={() => removeHobby(hobby)}
                                      className="ml-1 text-white/80 hover:text-white"
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                            
                            <div className="relative">
                              <input
                                type="text"
                                value={currentHobby}
                                onChange={handleHobbyInputChange}
                                onKeyDown={handleHobbyKeyDown}
                                className="w-full bg-[#333333] border-0 px-0 py-0 text-white focus:outline-none focus:ring-1 focus:ring-[#C9A335] rounded font-medium"
                                placeholder="Add a hobby and press Enter"
                              />
                              {showSuggestions && filteredSuggestions.length > 0 && (
                                <div 
                                  ref={suggestionsRef} 
                                  className="absolute z-10 mt-1 w-full max-h-28 overflow-y-auto bg-[#1E1E1E] rounded shadow-md"
                                >
                                  {filteredSuggestions.map((hobby) => (
                                    <button
                                      key={hobby}
                                      onClick={() => addHobby(hobby)}
                                      className="text-left text-sm text-gray-300 hover:bg-[#333333] px-2 py-1 w-full"
                                      type="button"
                                    >
                                      {hobby}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedHobbies.length > 0 ? (
                              selectedHobbies.map((hobby) => {
                                const category = getHobbyCategory(hobby);
                                return (
                                  <span 
                                    key={hobby}
                                    className={`${HOBBY_CATEGORIES[category].color} text-white text-xs px-2 py-0.5 rounded-full`}
                                  >
                                    {hobby}
                                  </span>
                                );
                              })
                            ) : (
                              <p className="font-medium">Not provided</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-white hover:text-gray-300 transition-colors"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 text-[#C9A335] hover:text-[#E5BD4F] transition-colors flex items-center"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#C9A335]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* View Mode - Original Content */
              <div className="space-y-5">
                <div className="p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Row 1: Full Name | Birthday */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Full name</p>
                      <div className="flex items-center">
                        <FaIdCard className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{nameWithMiddleInitial}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Birthday</p>
                      <div className="flex items-center">
                        <FaBirthdayCake className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{formatDate(profile.birthday)}</p>
                      </div>
                    </div>
                    
                    {/* Row 2: Profession (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Profession</p>
                      <div className="flex items-center">
                        <FaBriefcase className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{profile.profession || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                    
                    {/* Row 3: Phone | Email */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Phone</p>
                      <div className="flex items-center">
                        <FaPhone className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{profile.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Email</p>
                      <div className="flex items-start">
                        <IoIosMail className="h-5 w-5 text-[#C9A335] mr-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-all text-sm sm:text-base">{profile.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Row 4: Address (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Address</p>
                      <div className="flex items-center text-gray-500 italic">
                        <p>Coming soon</p>
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                    
                    {/* Row 5: Spouse | Children */}
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Spouse</p>
                      <div className="flex items-center">
                        <GiBigDiamondRing className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{profile.spouse_name || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Children</p>
                      <div className="flex items-center">
                        <FaChildren className="h-5 w-5 text-[#C9A335] mr-3" />
                        <p className="font-medium break-words">{profile.children || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="sm:col-span-2 mt-0 mb-0">
                      <div className="border-t border-gray-700"></div>
                    </div>
                    
                    {/* Row 6: Hobbies & Interests (spanning both columns) */}
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400 font-['Roboto'] capitalize tracking-wide mb-1">Hobbies & interests</p>
                      <div className="pl-8">
                        <div className="flex flex-wrap gap-1">
                          {selectedHobbies.length > 0 ? (
                            selectedHobbies.map((hobby) => {
                              const category = getHobbyCategory(hobby);
                              return (
                                <span 
                                  key={hobby}
                                  className={`${HOBBY_CATEGORIES[category].color} text-white text-xs px-2 py-0.5 rounded-full`}
                                >
                                  {hobby}
                                </span>
                              );
                            })
                          ) : (
                            <p className="font-medium">Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Featured Photos Section */}
          <div className="mt-6 bg-[#242424] rounded-xl overflow-hidden col-span-12">
            <FeaturedPhotos 
              userId={profile.id} 
              userFolderName={fullName.replace(/\s+/g, '_') || profile.id}
              isOwnProfile={isOwnProfile}
              onComplete={refetchProfile}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-auto">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">© 2025 UPIS Batch '84 Alumni Portal</p>
              <p className="text-sm text-gray-400">All Rights Reserved</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-sm text-gray-300 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="text-sm text-gray-300 hover:underline">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Cropper Modal */}
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCroppedImageUpload}
          onCancel={handleCancelCrop}
        />
      )}
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden"
        aria-hidden="true"
      />
      
      {/* Loading Overlay */}
      {uploadingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#242424] p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C9A335] mx-auto mb-4"></div>
            <p className="text-gray-300">Uploading photo...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper component with provider
export default function ProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [supabase.auth])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#C9A335]"></div>
      </div>
    )
  }
  
  return (
    <ProfileProvider user={user}>
      <ProfileContent />
    </ProfileProvider>
  )
}

{/* Add text-shadow utility class */}
<style jsx global>{`
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`}</style>
