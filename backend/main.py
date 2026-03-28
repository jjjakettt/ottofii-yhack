from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import connect, streams, actions
from agent.router import router as agent_router

app = FastAPI(title="Ottofii API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(connect.router)
app.include_router(streams.router)
app.include_router(agent_router, prefix="/agent", tags=["agent"])
app.include_router(actions.router)


@app.get("/health")
def health():
    return {"status": "ok"}
