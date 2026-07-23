#[tokio::main]
async fn main() -> anyhow::Result<()> {
    lukyss_bar_api::run().await
}
