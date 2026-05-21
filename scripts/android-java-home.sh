#!/usr/bin/env bash
# JDK pour Gradle sur Mac (Android Studio ou Homebrew).
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  return 0 2>/dev/null || exit 0
fi
if [[ -x "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java" ]]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
elif [[ -d "/Library/Java/JavaVirtualMachines" ]]; then
  jhome="$(/usr/libexec/java_home 2>/dev/null || true)"
  if [[ -n "$jhome" ]]; then
    export JAVA_HOME="$jhome"
  fi
fi
