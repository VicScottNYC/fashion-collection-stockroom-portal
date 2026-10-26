from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_FILE_SIZE = 5 * 1024 * 1024
MIN_DIMENSION = 200
MAX_DIMENSION = 4000

ALLOWED_FORMATS = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
    "WEBP": ("image/webp", "webp"),
}


async def validate_product_image(
    file: UploadFile,
) -> tuple[bytes, str, str]:
    """Validate and normalize an uploaded product image."""

    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    # Read at most one byte beyond the permitted size.
    contents = await file.read(MAX_FILE_SIZE + 1)

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 5 MB upload limit.",
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    try:
        # Verify the original file before decoding it again.
        with Image.open(BytesIO(contents)) as image:
            detected_format = image.format

            if detected_format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=415,
                    detail="Unsupported image format.",
                )

            image.verify()

        with Image.open(BytesIO(contents)) as image:
            image = ImageOps.exif_transpose(image)
            width, height = image.size

            if not (
                MIN_DIMENSION <= width <= MAX_DIMENSION
                and MIN_DIMENSION <= height <= MAX_DIMENSION
            ):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Image dimensions must be between "
                        "200 and 4000 pixels per side."
                    ),
                )

            media_type, extension = ALLOWED_FORMATS[detected_format]

            # Re-encode rather than storing untrusted original bytes.
            if detected_format == "JPEG":
                image = image.convert("RGB")
            elif image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA")

            output = BytesIO()
            image.save(output, format=detected_format)

            return output.getvalue(), media_type, extension

    except HTTPException:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise HTTPException(
            status_code=400,
            detail="The file is not a valid image.",
        ) from None