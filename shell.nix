let
    pkgs = import <nixpkgs> {};
    stdenv = pkgs.stdenv;
    node = import ./nixpkgs/node8-env.nix { pkgs = pkgs; };
in stdenv.mkDerivation rec {
    name = "TSOMI";

    buildInputs = [ node ];

    LD_LIBRARY_PATH = pkgs.stdenv.lib.makeLibraryPath buildInputs;

    shellHook = ''
        export PS1="[$name] \[$txtgrn\]\u@\h\[$txtwht\]:\[$bldpur\]\w \[$txtcyn\]\$git_branch\[$txtred\]\$git_dirty \[$bldylw\]\$aws_env\[$txtrst\]\$ "
        export PATH=`pwd`/node_modules/.bin:$PATH
    '';
}

