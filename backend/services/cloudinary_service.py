"""
Cloudinary service for image upload and management.
"""
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import UploadFile
from typing import Optional, Dict, Any

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
    secure=True
)


class CloudinaryService:
    """Service for managing images on Cloudinary."""
    
    FOLDER_NAME = "battery-cells"
    
    async def upload_image(
        self, 
        file: UploadFile, 
        cell_id: str
    ) -> Dict[str, Any]:
        """
        Upload an image to Cloudinary.
        
        Args:
            file: The uploaded file
            cell_id: The cell's barcode ID for folder organization
            
        Returns:
            Dict with url and public_id
        """
        try:
            # Read file content
            content = await file.read()
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                folder=f"{self.FOLDER_NAME}/{cell_id}",
                public_id="cell_image",
                overwrite=True,
                resource_type="image",
                transformation=[
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto:good"},
                    {"fetch_format": "auto"}
                ]
            )
            
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "width": result.get("width"),
                "height": result.get("height"),
            }
            
        except Exception as e:
            raise ValueError(f"Error uploading image to Cloudinary: {str(e)}")
    
    async def delete_image(self, public_id: str) -> bool:
        """
        Delete an image from Cloudinary.
        
        Args:
            public_id: The Cloudinary public_id of the image
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not public_id:
                return True
                
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
            
        except Exception as e:
            print(f"Error deleting image from Cloudinary: {str(e)}")
            return False
    
    def is_configured(self) -> bool:
        """Check if Cloudinary is properly configured."""
        return all([
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET"),
        ])


# Global instance
cloudinary_service = CloudinaryService()
