{ pkgs ? import <nixos> {}
, stdenv ? pkgs.stdenv
, fetchurl ? pkgs.fetchurl
, buildFHS ? pkgs.buildFHSUserEnv
, mkDerivation ? pkgs.stdenv.mkDerivation
}:
let
    ver = "8.11.1";
    platform = if stdenv.system == "x86_64-linux" then "linux-x64"
        else if stdenv.system == "x86_64-darwin" then "darwin-x64"
        else abort "unsupported platform";
    pkgSha = if stdenv.system == "x86_64-linux" then "7fd86abad06f96cb2f889c2a0e25686a3de3e9a078ad946ded91ee4f28d8218a"
        else if stdenv.system == "x86_64-darwin" then "5c7b05899ff56910a2b8180f139d48612f349ac2c5d20f08dbbeffbed9e3a089"
        else abort "unsupported platform";

in mkDerivation rec {
    name = "node";

    src = fetchurl {
        url = "https://nodejs.org/download/release/v${ver}/node-v${ver}-${platform}.tar.gz";
        sha256 = pkgSha;
    };

    phases = [ "unpackPhase" "installPhase" ];

    installPhase = ''
        mkdir -p $out
        cp -r * $out
    '';


    # node-env = mkDerivation {
    #     name = "node-env";

    #     src = fetchurl {
    #         url = "https://nodejs.org/dist/v${ver}/node-v${ver}-${platform}.tar.gz";
    #         sha256 = pkgSha;
    #     };

    #     phases = [ "unpackPhase" "installPhase" ];

    #     installPhase = ''
    #         mkdir -p $out
    #         cp -r * $out
    #     '';
    # };

    # node = buildFHS {
    #     name = "node";
    #     # targetPkgs = pkgs: [ node-env
    #     #                      # pkgs.git
    #     #                    ];
    #     runScript = "node";
    # };

    # npm = buildFHS {
    #     name = "npm";
    #     # targetPkgs = pkgs: [ node-env
    #     #                      # pkgs.git
    #     #                    ];
    #     runScript = "npm";
    # };
}

