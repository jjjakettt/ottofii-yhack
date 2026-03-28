from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import connect, streams

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

# Person 3 adds: from routers import agent; app.include_router(agent.router)
# Person 4 adds: from routers import actions; app.include_router(actions.router)


@app.get("/health")
def health():
    return {"status": "ok"}
