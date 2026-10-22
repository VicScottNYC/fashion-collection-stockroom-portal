from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.products import router as products_router


app = FastAPI(
    title="Fashion Collection & Stockroom API",
    description="Backend services for fashion collections and inventory management.",
    version="0.1.0",
)

# Allow our local React development server to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Register API endpoints
app.include_router(products_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "fashion-collection-stockroom-api",
        "version": "0.1.0",
    }