import PyPDF2
import os
from typing import Dict, Any, List
from pdf2image import convert_from_path
from PIL import Image
import base64
from io import BytesIO

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
    """
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract text from all pages
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n\n"
        
        return text.strip()
    
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


def parse_stats_data(text: str) -> Dict[str, Any]:
    """
    Parse extracted text to identify key stats information.
    
    Args:
        text: Extracted text from PDF
        
    Returns:
        Dictionary with parsed stats data
    """
    stats_data = {
        "raw_text": text,
        "detected_teams": [],
        "detected_players": [],
        "detected_stats": []
    }
    
    # Basic parsing - look for common patterns
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Look for team names (usually in title or header)
        if ' at ' in line.lower() or ' vs ' in line.lower():
            stats_data["detected_teams"].append(line)
        
        # Look for score patterns (e.g., "65-87", "Team 65")
        if any(char.isdigit() for char in line):
            if '-' in line or 'score' in line.lower():
                stats_data["detected_stats"].append(line)
    
    return stats_data


def convert_pdf_to_images(pdf_path: str, max_pages: int = 5) -> List[str]:
    """
    Convert PDF pages to base64-encoded images for vision analysis.
    
    Args:
        pdf_path: Path to the PDF file
        max_pages: Maximum number of pages to convert (default 5 to control costs)
        
    Returns:
        List of base64-encoded image strings
    """
    try:
        # Convert PDF to images (300 DPI for good quality)
        images = convert_from_path(
            pdf_path,
            dpi=200,  # Balance between quality and file size
            first_page=1,
            last_page=min(max_pages, 10)  # Limit to prevent huge costs
        )
        
        base64_images = []
        
        for img in images:
            # Resize if too large (to reduce API costs)
            max_dimension = 2000
            if img.width > max_dimension or img.height > max_dimension:
                ratio = min(max_dimension / img.width, max_dimension / img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="JPEG", quality=85)
            img_str = base64.b64encode(buffered.getvalue()).decode()
            base64_images.append(img_str)
        
        return base64_images
    
    except Exception as e:
        print(f"Warning: Could not convert PDF to images: {str(e)}")
        return []


def validate_pdf(file_path: str) -> bool:
    """
    Validate that the file is a valid PDF.
    
    Args:
        file_path: Path to the file
        
    Returns:
        True if valid PDF, False otherwise
    """
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            # Check if we can read at least one page
            if len(pdf_reader.pages) > 0:
                return True
        return False
    except:
        return False
