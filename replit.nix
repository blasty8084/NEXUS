# replit.nix file
{ pkgs }: 

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-22
    pkgs.git
    pkgs.curl
  ];

  shellHook = ''
    echo "🟢 Welcome to Minecraft Bot V2.3 environment!"
    echo "📦 Node version: $(node -v)"
    echo "💻 NPM version: $(npm -v)"
  '';
}
