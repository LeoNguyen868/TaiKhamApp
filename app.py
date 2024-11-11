from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
import uvicorn
app = FastAPI()

# Mount static files directory
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Set up templates directory
templates = Jinja2Templates(directory=".")

@app.get("/{page}.html", response_class=HTMLResponse)
async def read_page(request: Request, page: str):
    try:
        # Check if HTML file exists
        if Path(f"{page}.html").is_file():
            return templates.TemplateResponse(f"{page}.html", {"request": request})
        else:
            raise HTTPException(status_code=404, detail="Page not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Page not found")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)