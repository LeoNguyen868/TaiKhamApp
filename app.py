from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

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
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)